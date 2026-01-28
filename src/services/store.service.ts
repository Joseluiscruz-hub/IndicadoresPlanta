import { Injectable, signal, computed, OnDestroy, effect, untracked } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// --- FIREBASE CONFIGURATION ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyArMDaPtSCgz20QUlJhnUhhq5cRT98G7RI",
  authDomain: "miproyectoindicadores.firebaseapp.com",
  databaseURL: "https://miproyectoindicadores-default-rtdb.firebaseio.com",
  projectId: "miproyectoindicadores",
  storageBucket: "miproyectoindicadores.firebasestorage.app",
  messagingSenderId: "572003613740",
  appId: "1:572003613740:web:4001cae49871f7f467589"
};

export interface SafetyData {
  daysWithoutAccident: number;
  recordDays: number;
  previousRecord: number;
  lti: number;
  mti: number;
  fac: number;
}

export interface FreightData {
  day: string;
  planned: number;
  real: number;
}

export interface CrewData {
  name: string;
  pdf: number;
  stayTime: string;
  plantTime: string;
  palletsAverage: number;
  security: number;
  totalSum: number;
  ranking: number;
}

export interface WasteData {
  material: string;
  real: number;
  target: number;
}

export interface WarehouseData {
  ptReal: number;
  ptCap: number;
  matReal: number;
  matCap: number;
}

export interface DowntimeItem {
  line: string;
  lostTime: number; 
  crew: string;
  pdf: number; 
}

export interface StayTimeData {
  day: string;
  real: number; 
  goal: number; 
}

export interface BonusData {
  description: string;
  min: number;
  sat: number;
  exc: number;
  accumulated: number;
  weight: string;
  format: 'currency' | 'percent' | 'time' | 'number';
  status: string;
}

export type WidgetId = 'safety' | 'freight' | 'downtime' | 'stayTime' | 'waste_discipline' | 'bonus' | 'crew';

export interface WidgetConfig {
  id: WidgetId;
  label: string;
}

export type PerformanceMode = 'high' | 'eco';

interface GlobalState {
  safety: SafetyData;
  warehouse: WarehouseData;
  freight: FreightData[];
  stayTime: StayTimeData[];
  crews: CrewData[];
  waste: WasteData[];
  downtime: DowntimeItem[];
  bonusObjectives: BonusData[];
  layout: WidgetConfig[];
  announcement: string;
  isSimulationActive: boolean;
  performanceMode: PerformanceMode;
  lastUpdate: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService implements OnDestroy {
  // --- Signals ---
  
  readonly safety = signal<SafetyData>({
    daysWithoutAccident: 87,
    recordDays: 289,
    previousRecord: 467,
    lti: 0,
    mti: 0,
    fac: 0
  });

  readonly warehouse = signal<WarehouseData>({
    ptReal: 18500,
    ptCap: 22000,
    matReal: 4200,
    matCap: 5000
  });

  readonly freight = signal<FreightData[]>([]);
  readonly stayTime = signal<StayTimeData[]>([]);
  readonly crews = signal<CrewData[]>([]);
  readonly waste = signal<WasteData[]>([]);
  readonly downtime = signal<DowntimeItem[]>([]);
  readonly bonusObjectives = signal<BonusData[]>([]);
  
  readonly layout = signal<WidgetConfig[]>([
    { id: 'safety', label: 'Seguridad y Almacén' },
    { id: 'freight', label: 'Fleteo' },
    { id: 'downtime', label: 'Tiempo Perdido (Montacargas)' },
    { id: 'stayTime', label: 'Tiempo de Estancia' },
    { id: 'waste_discipline', label: 'Merma y Disciplina' },
    { id: 'bonus', label: 'Objetivos Bono Planta' },
    { id: 'crew', label: 'Resultados Tripulación' },
  ]);
  
  readonly announcement = signal<string>("⚠️ AVISO: Auditoría de Seguridad programada para el próximo Jueves. Mantener áreas despejadas. ⚠️");
  readonly lastUpdate = signal<Date>(new Date());
  readonly isSimulationActive = signal<boolean>(false);
  readonly performanceMode = signal<PerformanceMode>('high');
  readonly syncStatus = signal<'cloud' | 'local'>('local');

  private simulationInterval: any;
  private fastSimulationInterval: any;

  // --- Computed Signals ---
  
  // Calculate Global Bonus weighted percentage
  readonly bonusGlobal = computed(() => {
    const objs = this.bonusObjectives();
    let totalScore = 0;
    let totalWeight = 0;

    objs.forEach(obj => {
       const wStr = obj.weight.replace('%', '');
       const w = parseFloat(wStr);
       
       if (!isNaN(w)) {
          totalWeight += w;
          // Weighted scoring based on status
          if (obj.status === 'Excelente') {
             totalScore += w; 
          } else if (obj.status === 'Satisfactorio') {
             totalScore += (w * 0.85); 
          } else if (obj.status === 'Minimo') {
             totalScore += (w * 0.70); 
          }
       }
    });

    const percentage = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    let label = 'Bajo';
    if (percentage >= 95) label = 'Alto';
    else if (percentage >= 80) label = 'Medio';

    return {
       percentage: Math.min(100, Math.round(percentage)),
       label
    };
  });

  // Get Best Crew based on ranking
  readonly bestCrew = computed(() => {
     return this.crews().find(c => c.ranking === 1) || (this.crews().length > 0 ? this.crews()[0] : { name: '-', totalSum: 0 } as CrewData);
  });

  // --- Persistence ---
  private readonly STORAGE_KEY = 'dashboard_db_state_v4_kof';
  private isRemoteUpdate = false; 
  private db: any;
  private isFirebaseConfigured = false;

  constructor() {
    this.detectHardware();
    this.initDefaultData();
    this.initPersistenceAndSync();

    if (this.isSimulationActive()) {
      this.startSimulation();
    }
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  private detectHardware() {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const platform = navigator.platform?.toLowerCase() || '';

      // Detección robusta de TVs y sistemas embebidos de baja gama
      const isTV = ua.includes('smart-tv') ||
                   ua.includes('webos') ||
                   ua.includes('tizen') ||
                   ua.includes('bravia') ||
                   ua.includes('netcast') ||  // LG antiguos
                   ua.includes('maple') ||    // Samsung antiguos
                   ua.includes('roku') ||
                   ua.includes('vizio') ||
                   ua.includes('hisense') ||
                   ua.includes('tcl') ||
                   ua.includes('philips') ||
                   ua.includes('panasonic') ||
                   ua.includes('samsung') && ua.includes('tv') ||  // Samsung TVs
                   ua.includes('lg') && ua.includes('tv') ||        // LG TVs
                   platform.includes('tv') ||
                   platform.includes('linux') && ua.includes('chromium');  // Algunos TVs embebidos

      // Detección de navegadores antiguos o de baja performance
      const isOldBrowser = ua.includes('msie') ||
                           ua.includes('trident') ||
                           (ua.includes('chrome') && !ua.includes('chromium/7') && parseInt(ua.match(/chrome\/(\d+)/)?.[1] || '0') < 70) ||
                           (ua.includes('firefox') && parseInt(ua.match(/firefox\/(\d+)/)?.[1] || '0') < 60);

      // Detección de hardware limitado
      const lowConcurrency = (navigator.hardwareConcurrency || 4) < 4;
      const lowResolution = (screen.width * screen.height) < 1920 * 1080;  // Menos de Full HD

      // Detección de memoria baja (si disponible)
      const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 2;  // Menos de 2GB

      if (isTV || isOldBrowser || lowConcurrency || lowResolution || lowMemory) {
        this.performanceMode.set('eco');
      } else {
        this.performanceMode.set('high');
      }
    }
  }

  togglePerformanceMode() {
    this.performanceMode.update(m => m === 'high' ? 'eco' : 'high');
  }

  private initPersistenceAndSync() {
    if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "API_KEY_PLACEHOLDER") {
      try {
        const app = initializeApp(FIREBASE_CONFIG);
        this.db = getDatabase(app);
        this.isFirebaseConfigured = true;
        this.syncStatus.set('cloud');
        
        const dataRef = ref(this.db, 'dashboard_state');
        onValue(dataRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            this.isRemoteUpdate = true;
            this.applyState(val);
            this.isRemoteUpdate = false;
          }
        });
      } catch (e) {
        console.error('Sync: Firebase init failed', e);
        this.syncStatus.set('local');
      }
    } else {
      this.syncStatus.set('local');
    }

    const storedState = localStorage.getItem(this.STORAGE_KEY);
    if (storedState) {
      try {
        const parsed: GlobalState = JSON.parse(storedState);
        this.applyState(parsed);
      } catch (e) {
        console.error('Database: Failed to parse stored state', e);
      }
    }

    effect(() => {
      const state: GlobalState = {
        safety: this.safety(),
        warehouse: this.warehouse(),
        freight: this.freight(),
        stayTime: this.stayTime(),
        crews: this.crews(),
        waste: this.waste(),
        downtime: this.downtime(),
        bonusObjectives: this.bonusObjectives(),
        layout: this.layout(),
        announcement: this.announcement(),
        isSimulationActive: this.isSimulationActive(),
        performanceMode: this.performanceMode(),
        lastUpdate: this.lastUpdate().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));

      if (!this.isRemoteUpdate && this.isFirebaseConfigured && this.db) {
        const dataRef = ref(this.db, 'dashboard_state');
        set(dataRef, state).catch(err => console.error('Sync: Push failed', err));
      }
    });
  }

  private applyState(state: GlobalState) {
    if (!state) return;
    if (state.safety) this.safety.set(state.safety);
    if (state.warehouse) this.warehouse.set(state.warehouse);
    if (state.freight) this.freight.set(state.freight);
    if (state.stayTime) this.stayTime.set(state.stayTime);
    if (state.crews) this.crews.set(state.crews);
    if (state.waste) this.waste.set(state.waste);
    if (state.downtime) this.downtime.set(state.downtime);
    if (state.bonusObjectives) {
       const calculatedBonus = state.bonusObjectives.map(item => ({
         ...item,
         status: this.calculateBonusStatus(item)
       }));
       this.bonusObjectives.set(calculatedBonus);
    }
    if (state.layout) this.layout.set(state.layout);
    if (state.announcement) this.announcement.set(state.announcement);
    if (state.lastUpdate) this.lastUpdate.set(new Date(state.lastUpdate));
    if (state.performanceMode) this.performanceMode.set(state.performanceMode);
    if (state.isSimulationActive !== undefined && this.isSimulationActive() !== state.isSimulationActive) {
      this.isSimulationActive.set(state.isSimulationActive);
      if (state.isSimulationActive) this.startSimulation(); else this.stopSimulation();
    }
  }

  private initDefaultData() {
    // 1. Crews
    this.crews.set([
      { name: 'ARMAGEDOM', pdf: 1.12, stayTime: '00:50', plantTime: '00:46', palletsAverage: 14433, security: 5.00, totalSum: 18, ranking: 1 },
      { name: 'CRACKS', pdf: 1.03, stayTime: '00:58', plantTime: '00:53', palletsAverage: 15606, security: 5.00, totalSum: 16, ranking: 2 },
      { name: 'GLADIADORES', pdf: 0.98, stayTime: '01:05', plantTime: '00:54', palletsAverage: 20597, security: 5.00, totalSum: 14, ranking: 3 },
      { name: 'X-MEN', pdf: 1.06, stayTime: '00:52', plantTime: '00:45', palletsAverage: 15980, security: 5.00, totalSum: 13, ranking: 4 },
    ]);

    // 2. Bonus Objectives (As requested in prompt)
    const rawBonus: BonusData[] = [
      { 
        description: 'Merma producto terminado', 
        min: 319633, sat: 312974, exc: 306315, accumulated: 300000, 
        weight: '20%', format: 'currency', status: '' 
      },
      { 
        description: 'Cumplimiento programas Fleteo', 
        min: 97, sat: 98, exc: 99, accumulated: 98.5, 
        weight: '30%', format: 'percent', status: '' 
      },
      { 
        description: 'Tiempo de estancia', 
        min: 65, sat: 62, exc: 60, accumulated: 60, 
        weight: '20%', format: 'time', status: '' 
      },
      { 
        description: 'Desabasto / Tasa de llenado', 
        min: 0.0079, sat: 0.0070, exc: 0.0061, accumulated: 0.0065, 
        weight: '30%', format: 'number', status: '' 
      },
      { 
        description: 'Merma Materia Prima', 
        min: 12000, sat: 9000, exc: 7000, accumulated: 8500, 
        weight: 'N/A', format: 'currency', status: '' 
      },
    ];

    const processedBonus = rawBonus.map(item => ({
       ...item,
       status: this.calculateBonusStatus(item)
    }));
    this.bonusObjectives.set(processedBonus);
    
    // Other data defaults (Freight, StayTime, Waste, Downtime)
    const freightRaw = Array.from({length: 22}, (_, i) => ({ 
        d: `Dia ${i+1}`, p: 3000, r: 2800 + Math.floor(Math.random()*400) 
    }));
    this.freight.set(freightRaw.map(f => ({ day: f.d, planned: f.p, real: f.r })));
    
    const stayRaw = Array.from({length: 22}, (_, i) => ({ 
        d: `D${i+1}`, r: 50 + Math.floor(Math.random()*15), g: 55 
    }));
    this.stayTime.set(stayRaw.map(s => ({ day: s.d, real: s.r, goal: s.g })));
    
    this.waste.set([
      { material: 'Pet', real: 1250.50, target: 800.00 },
      { material: 'Etiqueta', real: 150.00, target: 200.00 },
      { material: 'Taparrosca', real: 450.75, target: 300.00 },
    ]);

    this.downtime.set([
        { line: 'LINEA001', lostTime: 115, crew: 'ARMAGEDOM', pdf: 1.12 },
        { line: 'LINEA002', lostTime: 204, crew: 'CRACKS', pdf: 1.03 },
        { line: 'LINEA003', lostTime: 97, crew: 'GLADIADORES', pdf: 0.98 },
        { line: 'LINEA004', lostTime: 417, crew: 'X-MEN', pdf: 1.06 },
    ]);
  }

  // --- Logic ---
  
  updateSafety(data: Partial<SafetyData>) { this.safety.update(s => ({ ...s, ...data })); this.touchUpdate(); }
  updateWarehouse(data: Partial<WarehouseData>) { this.warehouse.update(w => ({ ...w, ...data })); this.touchUpdate(); }
  updateFreight(data: FreightData[]) { this.freight.set(data); this.touchUpdate(); }
  updateStayTime(data: StayTimeData[]) { this.stayTime.set(data); this.touchUpdate(); }
  updateWaste(data: WasteData[]) { this.waste.set(data); this.touchUpdate(); }
  updateDowntime(data: DowntimeItem[]) { this.downtime.set(data); this.touchUpdate(); }
  updateAnnouncement(text: string) { this.announcement.set(text); this.touchUpdate(); }
  
  updateCrew(index: number, data: Partial<CrewData>) {
    this.crews.update(crews => {
      const newCrews = [...crews];
      newCrews[index] = { ...newCrews[index], ...data };
      return newCrews;
    });
    this.touchUpdate();
  }

  private calculateBonusStatus(item: BonusData): string {
    const val = item.accumulated;
    const lowerIsBetter = item.exc < item.min;
    
    if (lowerIsBetter) {
        if (val <= item.exc) return 'Excelente';
        if (val <= item.sat) return 'Satisfactorio';
        if (val <= item.min) return 'Minimo';
        return 'Bajo';
    } else {
        if (val >= item.exc) return 'Excelente';
        if (val >= item.sat) return 'Satisfactorio';
        if (val >= item.min) return 'Minimo';
        return 'Bajo';
    }
  }

  updateBonusResult(description: string, newValue: number) {
    this.bonusObjectives.update(items => {
      return items.map(item => {
        if (item.description.toLowerCase().includes(description.toLowerCase()) || 
            description.toLowerCase().includes(item.description.toLowerCase())) {
          
          const updatedItem = { ...item, accumulated: newValue };
          updatedItem.status = this.calculateBonusStatus(updatedItem);
          return updatedItem;
        }
        return item;
      });
    });
    this.touchUpdate();
  }

  updateBonusRaw(index: number, data: Partial<BonusData>) {
     this.bonusObjectives.update(items => {
        const newItems = [...items];
        const updatedItem = { ...newItems[index], ...data };
        updatedItem.status = this.calculateBonusStatus(updatedItem);
        newItems[index] = updatedItem;
        return newItems;
     });
     this.touchUpdate();
  }

  moveWidget(index: number, direction: 'up' | 'down') {
    this.layout.update(currentLayout => {
      const newLayout = [...currentLayout];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newLayout.length) {
        [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
      }
      return newLayout;
    });
  }

  toggleSimulation(active: boolean) {
    this.isSimulationActive.set(active);
    if (active) this.startSimulation(); else this.stopSimulation();
  }

  randomizeFreight() {
    this.freight.update(current => current.map(item => {
       const chance = Math.random();
       let adjustment = chance > 0.3 ? (Math.floor(Math.random() * 25) + 5) : (Math.floor(Math.random() * 10) - 5);
       let newReal = Math.max(0, item.real + adjustment);
       if (newReal > (item.planned * 1.1)) newReal = item.planned * 0.85;
       return { ...item, real: newReal };
    }));
    this.touchUpdate();
  }
  
  randomizeStayTime() {
    this.stayTime.update(current => current.map(item => ({
       ...item, real: Math.max(20, Math.min(120, item.real + Math.floor((Math.random() - 0.5) * 10)))
    })));
    this.touchUpdate();
  }

  randomizeSafetyAndWarehouse() {
    this.safety.update(s => {
      const change = Math.random();
      let newLti = s.lti, newMti = s.mti;
      if (change > 0.9) {
         if (Math.random() > 0.5) newLti = Math.max(0, s.lti + (Math.random() > 0.5 ? 1 : -1));
         if (Math.random() > 0.5) newMti = Math.max(0, s.mti + (Math.random() > 0.5 ? 1 : -1));
      }
      return { ...s, lti: newLti, mti: newMti };
    });
    this.warehouse.update(w => {
       const ptVar = Math.floor((Math.random() - 0.5) * 500);
       const matVar = Math.floor((Math.random() - 0.5) * 200);
       return {
         ...w,
         ptReal: Math.max(0, Math.min(w.ptCap, w.ptReal + ptVar)),
         matReal: Math.max(0, Math.min(w.matCap, w.matReal + matVar))
       };
    });
    this.touchUpdate();
  }

  private startSimulation() {
    this.stopSimulation(); 
    this.simulationInterval = setInterval(() => { this.randomizeFreight(); this.randomizeStayTime(); }, 30000);
    this.fastSimulationInterval = setInterval(() => { this.randomizeSafetyAndWarehouse(); }, 15000);
  }

  private stopSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.fastSimulationInterval) clearInterval(this.fastSimulationInterval);
  }

  private touchUpdate() {
    this.lastUpdate.set(new Date());
  }
}