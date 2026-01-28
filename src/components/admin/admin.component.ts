import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../services/store.service';
import { GoogleGenAI } from "@google/genai";

// Declare SheetJS global
declare const XLSX: any;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  store = inject(StoreService);

  // Local state copies to edit manually
  safetyForm = { ...this.store.safety() };
  warehouseForm = { ...this.store.warehouse() };
  
  // Quick access to edit crews
  crews = this.store.crews;
  
  // Quick access to bonus
  bonus = this.store.bonusObjectives;

  // AI State
  isAnalyzing = signal(false);
  analysisResult = signal<string | null>(null);

  // Upload State
  isUploading = signal(false);

  saveSafety() {
    this.store.updateSafety(this.safetyForm);
    alert('Seguridad actualizada!');
  }
  
  saveWarehouse() {
    this.store.updateWarehouse(this.warehouseForm);
    alert('Almacén actualizado!');
  }
  
  updateAnnouncement(event: any) {
    this.store.updateAnnouncement(event.target.value);
  }

  // Generic updater for crew fields
  updateCrewField(index: number, field: string, value: any) {
    let parsedValue = value;
    
    // Numeric fields parsing
    if (['pdf', 'palletsAverage', 'security', 'totalSum', 'ranking'].includes(field)) {
      const num = parseFloat(value);
      if (!isNaN(num)) parsedValue = num;
    }
    
    this.store.updateCrew(index, { [field]: parsedValue });
  }
  
  // Generic updater for Bonus Table fields (Manual override)
  updateBonusField(index: number, field: string, value: any) {
      let parsedValue = value;
      // Numeric parsing
      if (['accumulated'].includes(field)) {
          const num = parseFloat(value);
          if (!isNaN(num)) parsedValue = num;
      }
      this.store.updateBonusRaw(index, { [field]: parsedValue });
  }

  randomizeFreight() {
    this.store.randomizeFreight();
  }
  
  randomizeStayTime() {
    this.store.randomizeStayTime();
  }
  
  moveWidget(index: number, direction: 'up' | 'down') {
    this.store.moveWidget(index, direction);
  }

  toggleSimulation() {
    this.store.toggleSimulation(!this.store.isSimulationActive());
  }

  // --- Gemini AI Logic ---

  async generateCrewReport() {
    if (this.isAnalyzing()) return;
    
    this.isAnalyzing.set(true);
    this.analysisResult.set(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
      
      const currentData = JSON.stringify(this.store.crews());
      const prompt = `
        Actúa como un Gerente de Planta experto en logística y producción.
        Analiza los siguientes datos de rendimiento de las tripulaciones del turno matutino:
        ${currentData}
        
        Métricas clave: 
        - PDF (Productividad): Mayor es mejor.
        - Tiempo Estancia: Menor es mejor.
        - Seguridad: 5.00 es perfecto.
        
        Genera un reporte ejecutivo breve (máximo 150 palabras) en español que incluya:
        1. ¿Quién es la tripulación ganadora y por qué?
        2. Una observación crítica sobre la tripulación con menor rendimiento.
        3. Una recomendación de mejora general.
        
        Usa un tono profesional, directo e industrial.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      this.analysisResult.set(response.text);

    } catch (error) {
      console.error('Error generating AI report:', error);
      this.analysisResult.set('Error al conectar con Gemini. Verifique su API Key.');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  // --- Excel Parsing Helpers ---

  /**
   * Converts various time formats to Minutes (number).
   * Handles:
   * - Excel Serial Date (0.0416 => 60 min)
   * - String "HH:MM" ("01:00" => 60 min)
   * - Plain Number (60 => 60)
   */
  private parseExcelTime(val: any): number {
    if (val === undefined || val === null || val === '') return 0;
    
    // 1. Handle JS Date objects (if sheet_to_json parses them directly)
    if (val instanceof Date) {
        const totalMinutes = (val.getHours() * 60) + val.getMinutes();
        return Math.round(totalMinutes);
    }

    // 2. Handle string "HH:MM" or "HH:MM:SS"
    if (typeof val === 'string' && val.includes(':')) {
      const parts = val.split(':').map((p: string) => parseFloat(p));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        // HH:MM
        return (parts[0] * 60) + parts[1];
      }
    }

    // 3. Handle Numeric Values (Excel Serial or Integers)
    const num = Number(val);
    if (!isNaN(num)) {
      // Heuristic: Excel serial dates for time are usually < 1.0 (24 hours).
      // However, typical KPI values for "Stay Time" (minutes) are often > 20.
      // E.g. 0.0416 (1 hr) vs 60 (60 mins).
      // We assume if value < 2.0 (48 hours), it is likely a serial date fraction.
      // This covers up to 48 hours of time, which avoids confusion with "2 minutes".
      // "2 minutes" entered as 2 in Excel is ambiguous with "2 days" (48h), 
      // but "2 minutes" is extremely low for these KPIs, so checking < 2.0 is safer for Time formats.
      if (num < 2.0 && num > 0) {
        return Math.round(num * 24 * 60);
      }
      // Otherwise, assume integer minutes
      return Math.round(num);
    }

    return 0;
  }

  /**
   * Converts various inputs to "HH:MM" string format.
   * Useful for the Crew table which expects strings.
   */
  private formatTimeToString(val: any): string {
    const minutes = this.parseExcelTime(val);
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // --- Excel Logic ---

  downloadTemplate() {
    const wb = XLSX.utils.book_new();

    // 1. Safety Sheet
    const safetyData = [this.store.safety()];
    const wsSafety = XLSX.utils.json_to_sheet(safetyData);
    XLSX.utils.book_append_sheet(wb, wsSafety, "Seguridad");

    // NEW: Warehouse Sheet
    const whData = [this.store.warehouse()];
    const wsWh = XLSX.utils.json_to_sheet(whData);
    XLSX.utils.book_append_sheet(wb, wsWh, "Almacen");

    // 2. Freight Sheet
    const freightData = this.store.freight();
    const wsFreight = XLSX.utils.json_to_sheet(freightData);
    XLSX.utils.book_append_sheet(wb, wsFreight, "Fleteo");

    // 3. StayTime Sheet
    const stayTimeData = this.store.stayTime();
    const wsStayTime = XLSX.utils.json_to_sheet(stayTimeData);
    XLSX.utils.book_append_sheet(wb, wsStayTime, "TiempoEstancia");

    // 4. Crews Sheet
    const crewData = this.store.crews();
    const wsCrews = XLSX.utils.json_to_sheet(crewData);
    XLSX.utils.book_append_sheet(wb, wsCrews, "Tripulacion");

    // 5. Waste Sheet
    const wasteData = this.store.waste();
    const wsWaste = XLSX.utils.json_to_sheet(wasteData);
    XLSX.utils.book_append_sheet(wb, wsWaste, "Mermas");

    // 6. Downtime Sheet
    const downtimeData = this.store.downtime();
    const wsDowntime = XLSX.utils.json_to_sheet(downtimeData);
    XLSX.utils.book_append_sheet(wb, wsDowntime, "TiempoPerdido");
    
    // 7. Bonus Sheet (Simplified for user input)
    // We only need the Result column essentially
    const bonusData = this.store.bonusObjectives().map(b => ({
      Indicador: b.description,
      MIN: b.min,
      SAT: b.sat,
      EXC: b.exc,
      Resultado: b.accumulated, // Use 'Resultado' as column header per user request
      Peso: b.weight
    }));
    const wsBonus = XLSX.utils.json_to_sheet(bonusData);
    XLSX.utils.book_append_sheet(wb, wsBonus, "Bono");

    XLSX.writeFile(wb, "Dashboard_Plantilla.xlsx");
  }

  async onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) {
      alert('Por favor carga un solo archivo.');
      return;
    }

    this.isUploading.set(true);

    try {
      const file = target.files[0];
      const arrayBuffer = await file.arrayBuffer();
      this.store.toggleSimulation(false);

      const workbook = XLSX.read(arrayBuffer, { dense: false }); // dense: false needed for some legacy sheet logic
      let updatedCount = 0;

      // 1. Parse Safety
      if (workbook.Sheets['Seguridad']) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets['Seguridad']);
        if (data.length > 0) {
          this.store.updateSafety(data[0] as any);
          this.safetyForm = { ...this.store.safety() };
          updatedCount++;
        }
      }

      // NEW: Parse Warehouse (Almacen)
      if (workbook.Sheets['Almacen']) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets['Almacen']);
        if (data.length > 0) {
          this.store.updateWarehouse(data[0] as any);
          this.warehouseForm = { ...this.store.warehouse() };
          updatedCount++;
        }
      }

      // 2. Parse Freight
      if (workbook.Sheets['Fleteo']) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets['Fleteo']);
        if (data.length > 0) {
          this.store.updateFreight(data as any);
          updatedCount++;
        }
      }

      // 3. Parse StayTime (ROBUST TIME PARSING)
      if (workbook.Sheets['TiempoEstancia']) {
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets['TiempoEstancia']);
        if (rawData.length > 0) {
          const processedData = rawData.map((row: any) => ({
            day: row.day || row.Dia || row.Day,
            real: this.parseExcelTime(row.real),
            goal: this.parseExcelTime(row.goal || row.meta)
          }));
          this.store.updateStayTime(processedData);
          updatedCount++;
        }
      }

      // 4. Parse Crews (ROBUST TIME PARSING - Outputs String HH:MM)
      if (workbook.Sheets['Tripulacion']) {
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets['Tripulacion']);
        if (rawData.length > 0) {
          const processedData = rawData.map((row: any) => ({
            ...row,
            stayTime: this.formatTimeToString(row.stayTime),
            plantTime: this.formatTimeToString(row.plantTime)
          }));
          this.store.crews.set(processedData);
          updatedCount++;
        }
      }

      // 5. Parse Waste
      if (workbook.Sheets['Mermas']) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets['Mermas']);
        if (data.length > 0) {
          this.store.updateWaste(data as any);
          updatedCount++;
        }
      }
      
      // 6. Parse Downtime
      if (workbook.Sheets['TiempoPerdido']) {
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets['TiempoPerdido']);
        if (rawData.length > 0) {
           // Convert lostTime to minutes if it comes as Excel decimal
           const processedData = rawData.map((row: any) => ({
             ...row,
             lostTime: this.parseExcelTime(row.lostTime)
           }));
           this.store.updateDowntime(processedData);
           updatedCount++;
        }
      }
      
      // 7. Parse Bonus (UPDATE RESULT ONLY + ROBUST PERCENT/TIME)
      const bonusSheetName = workbook.SheetNames.find((n: string) => n.toLowerCase().includes('bono') || n.toLowerCase().includes('indicador'));
      if (bonusSheetName) {
         const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[bonusSheetName]);
         if (rawData.length > 0) {
            const currentObjectives = this.store.bonusObjectives();

            rawData.forEach((row: any) => {
               const desc = row.Indicador || row.Description || row.Descripcion;
               const result = row.Resultado || row.Accumulated || row.Real || row.accumulated;
               
               if (desc && result !== undefined) {
                 // Try exact match first, then fuzzy
                 const targetItem = currentObjectives.find(b => 
                    b.description.toLowerCase().trim() === desc.toString().toLowerCase().trim() ||
                    desc.toString().toLowerCase().includes(b.description.toLowerCase())
                 );

                 if (targetItem) {
                     let finalResult = Number(result);

                     if (targetItem.format === 'time') {
                        finalResult = this.parseExcelTime(result);
                     } 
                     else if (targetItem.format === 'percent') {
                        // Fix for Excel converting 98% to 0.98
                        // We assume KPI percentages are on 0-100 scale based on existing data (e.g. 98.5)
                        if (finalResult <= 1 && finalResult > 0) {
                            finalResult = finalResult * 100;
                        }
                     }

                     this.store.updateBonusResult(targetItem.description, finalResult);
                 }
               }
            });
            updatedCount++;
         }
      }

      this.isUploading.set(false);

      if (updatedCount > 0) {
        alert(`¡Éxito! Se actualizaron ${updatedCount} secciones.`);
      } else {
        alert('No se encontraron datos válidos.');
      }

    } catch (err) {
      console.error(err);
      this.isUploading.set(false);
      alert('Error al leer el archivo. Verifica el formato.');
    }
    
    evt.target.value = '';
  }
}