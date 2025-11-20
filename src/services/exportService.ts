import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ReporteConsultas, StatisticsData } from '../types/consultation';

export class ExportService {
  /**
   * Exporta el reporte de consultas a PDF con formato profesional
   */
  static exportToPDF(
    reportData: ReporteConsultas,
    statisticsData: StatisticsData | null,
    fileName: string
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Configuración de colores profesionales
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue suave (#3b82f6)
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate
    const accentColor: [number, number, number] = [6, 182, 212]; // Cyan
    const lightGray: [number, number, number] = [248, 250, 252]; // Muy claro
    
    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CONSULTAS MÉDICAS', pageWidth / 2, 15, { align: 'center' });
    
    // Información del hospital (puedes personalizar)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Hospitalaria', pageWidth / 2, 20, { align: 'center' });
    
    let yPosition = 35;
    
    // Información del reporte
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL REPORTE', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const reportInfo = [
      ['Fecha de Generación:', reportData.resumen.fechaGeneracion],
      ['Total de Consultas:', reportData.resumen.totalConsultas.toString()],
      ['Médicos Activos:', reportData.resumen.medicosActivos.toString()],
      ['Filtros Aplicados:', reportData.resumen.filtrosActivos.toString()]
    ];
    
    reportInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    
    // Estadísticas generales (si están disponibles)
    if (statisticsData) {
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTADÍSTICAS GENERALES', 20, yPosition);
      
      yPosition += 10;
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const statsInfo = [
        ['Promedio de Consultas por Médico:', statisticsData.promedioConsultasPorMedico.toFixed(1)],
        ['Médico con Más Consultas:', statisticsData.medicoConMasConsultas],
        ['Máximo de Consultas:', statisticsData.maxConsultasPorMedico.toString()]
      ];
      
      statsInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 90, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }
    
    // Tabla de médicos y consultas
    if (reportData.medicosPorConsultas.length > 0) {
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE POR MÉDICO', 20, yPosition);
      
      yPosition += 5;
      
      // Preparar datos para la tabla
      const tableData = reportData.medicosPorConsultas.map(medico => [
        medico.nombreMedico,
        medico.especialidad,
        medico.totalConsultas.toString(),
        medico.consultas.length.toString()
      ]);
      
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Médico', 'Especialidad', 'Total Consultas', 'Consultas Detalladas']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          textColor: secondaryColor,
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Especialidades (si hay estadísticas)
    if (statisticsData && statisticsData.especialidades.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DISTRIBUCIÓN POR ESPECIALIDADES', 20, yPosition);
      
      yPosition += 5;
      
      const specialtyData = statisticsData.especialidades.map(esp => [
        esp.nombreEspecialidad,
        esp.totalMedicos.toString(),
        esp.totalConsultas.toString(),
        ((esp.totalConsultas / statisticsData.totalConsultas) * 100).toFixed(1) + '%'
      ]);
      
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Especialidad', 'Médicos', 'Consultas', 'Porcentaje']],
        body: specialtyData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: accentColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          textColor: secondaryColor,
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Especialidad - reducido
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 20, right: 20, top: 10, bottom: 10 }, // Márgenes equilibrados
        tableWidth: 'auto'
      });
    }
    
    // Footer en todas las páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea separadora
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      // Texto del footer
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      );
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
        20,
        pageHeight - 10
      );
    }
    
    // Guardar el archivo
    doc.save(`${fileName}.pdf`);
  }
  
  /**
   * Exporta el reporte de consultas a Excel
   */
  static exportToExcel(
    reportData: ReporteConsultas,
    statisticsData: StatisticsData | null,
    fileName: string
  ): void {
    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Resumen
    const summaryData = [
      ['REPORTE DE CONSULTAS MÉDICAS', '', '', ''],
      ['', '', '', ''],
      ['Fecha de Generación:', reportData.resumen.fechaGeneracion, '', ''],
      ['Total de Consultas:', reportData.resumen.totalConsultas, '', ''],
      ['Médicos Activos:', reportData.resumen.medicosActivos, '', ''],
      ['Filtros Aplicados:', reportData.resumen.filtrosActivos, '', ''],
      ['', '', '', '']
    ];
    
    if (statisticsData) {
      summaryData.push(
        ['ESTADÍSTICAS GENERALES', '', '', ''],
        ['', '', '', ''],
        ['Promedio Consultas/Médico:', statisticsData.promedioConsultasPorMedico.toFixed(1), '', ''],
        ['Médico con Más Consultas:', statisticsData.medicoConMasConsultas, '', ''],
        ['Máximo de Consultas:', statisticsData.maxConsultasPorMedico, '', '']
      );
    }
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    
    // Hoja 2: Médicos
    const medicosData = [
      ['Médico', 'Especialidad', 'Total Consultas', 'Consultas Registradas']
    ];
    
    reportData.medicosPorConsultas.forEach(medico => {
      medicosData.push([
        medico.nombreMedico,
        medico.especialidad,
        medico.totalConsultas.toString(),
        medico.consultas.length.toString()
      ]);
    });
    
    const medicosSheet = XLSX.utils.aoa_to_sheet(medicosData);
    XLSX.utils.book_append_sheet(workbook, medicosSheet, 'Médicos');
    
    // Hoja 3: Consultas Detalladas
    const consultasData = [
      ['Médico', 'Especialidad', 'Fecha', 'Hora', 'Paciente', 'Motivo', 'Diagnóstico', 'Tratamiento']
    ];
    
    reportData.medicosPorConsultas.forEach(medico => {
      medico.consultas.forEach(consulta => {
        consultasData.push([
          medico.nombreMedico,
          medico.especialidad,
          consulta.fecha,
          consulta.hora,
          consulta.nombrePaciente,
          consulta.motivo,
          consulta.diagnostico,
          consulta.tratamiento
        ]);
      });
    });
    
    const consultasSheet = XLSX.utils.aoa_to_sheet(consultasData);
    XLSX.utils.book_append_sheet(workbook, consultasSheet, 'Consultas Detalladas');
    
    // Hoja 4: Especialidades (si hay estadísticas)
    if (statisticsData && statisticsData.especialidades.length > 0) {
      const especialidadesData = [
        ['Especialidad', 'Total Médicos', 'Total Consultas', 'Porcentaje']
      ];
      
      statisticsData.especialidades.forEach(esp => {
        especialidadesData.push([
          esp.nombreEspecialidad,
          esp.totalMedicos.toString(),
          esp.totalConsultas.toString(),
          ((esp.totalConsultas / statisticsData.totalConsultas) * 100).toFixed(1) + '%'
        ]);
      });
      
      const especialidadesSheet = XLSX.utils.aoa_to_sheet(especialidadesData);
      XLSX.utils.book_append_sheet(workbook, especialidadesSheet, 'Especialidades');
    }
    
    // Generar y descargar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  }

  /**
   * Exporta el reporte individual de un médico a PDF
   */
  static exportDoctorToPDF(
    doctorData: any,
    fileName: string
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Configuración de colores profesionales
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue suave (#3b82f6)
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate
    // const accentColor: [number, number, number] = [6, 182, 212]; // Cyan
    
    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE INDIVIDUAL DE MÉDICO', pageWidth / 2, 15, { align: 'center' });
    
    // Información del hospital
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Hospitalaria', pageWidth / 2, 20, { align: 'center' });
    
    let yPosition = 35;
    
    // Información del médico
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL MÉDICO', 20, yPosition);
    
    yPosition += 15;
    
    // Datos del médico
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr(a). ${doctorData.nombreMedico}`, 20, yPosition);
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Especialidad: ${doctorData.especialidad}`, 20, yPosition);
    
    yPosition += 6;
    doc.text(`Total de Consultas: ${doctorData.totalConsultas}`, 20, yPosition);
    
    yPosition += 6;
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition);
    
    yPosition += 20;
    
    // Tabla de consultas
    if (doctorData.consultas && doctorData.consultas.length > 0) {
      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSULTAS REALIZADAS', 20, yPosition);
      
      yPosition += 10;
      
      const consultasData = doctorData.consultas.map((consulta: any) => [
        consulta.fecha,
        consulta.hora || 'N/A',
        consulta.nombrePaciente,
        consulta.motivo,
        consulta.diagnostico,
        consulta.tratamiento || 'N/A'
      ]);
      
      autoTable(doc, {
        head: [['Fecha', 'Hora', 'Paciente', 'Motivo', 'Diagnóstico', 'Tratamiento']],
        body: consultasData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: secondaryColor,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Fecha - reducido
          1: { cellWidth: 18 }, // Hora - reducido
          2: { cellWidth: 30 }, // Paciente - reducido
          3: { cellWidth: 32 }, // Motivo - reducido
          4: { cellWidth: 32 }, // Diagnóstico - reducido
          5: { cellWidth: 30 }  // Tratamiento - reducido
        },
        margin: { left: 20, right: 20, top: 20, bottom: 20 }, // Márgenes más equilibrados
        tableWidth: 'auto',
        styles: {
          cellPadding: 3,
          fontSize: 8,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        didDrawPage: () => {
          // Footer en cada página
          const pageCount = doc.getNumberOfPages();
          const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
          
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Página ${currentPage} de ${pageCount}`,
            pageWidth - 30,
            doc.internal.pageSize.height - 10
          );
          
          doc.text(
            `Generado el ${new Date().toLocaleString('es-ES')}`,
            20,
            doc.internal.pageSize.height - 10
          );
        }
      });
    } else {
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(12);
      doc.text('No hay consultas registradas para este médico.', 20, yPosition);
    }
    
    // Descargar el PDF
    doc.save(`${fileName}.pdf`);
  }

  /**
   * Exporta el reporte individual de un médico a Excel
   */
  static exportDoctorToExcel(
    doctorData: any,
    fileName: string
  ): void {
    const workbook = XLSX.utils.book_new();
    
    // Hoja de información del médico
    const medicoInfo = [
      ['REPORTE INDIVIDUAL DE MÉDICO'],
      [''],
      ['Nombre:', doctorData.nombreMedico],
      ['Especialidad:', doctorData.especialidad],
      ['Total de Consultas:', doctorData.totalConsultas],
      ['Fecha del Reporte:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['CONSULTAS REALIZADAS']
    ];
    
    // Agregar consultas si existen
    if (doctorData.consultas && doctorData.consultas.length > 0) {
      // Headers de la tabla
      medicoInfo.push(['Fecha', 'Hora', 'Paciente', 'Motivo', 'Diagnóstico', 'Tratamiento']);
      
      // Datos de consultas
      doctorData.consultas.forEach((consulta: any) => {
        medicoInfo.push([
          consulta.fecha,
          consulta.hora || 'N/A',
          consulta.nombrePaciente,
          consulta.motivo,
          consulta.diagnostico,
          consulta.tratamiento || 'N/A'
        ]);
      });
    } else {
      medicoInfo.push(['No hay consultas registradas']);
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(medicoInfo);
    
    // Ajustar el ancho de las columnas
    worksheet['!cols'] = [
      { width: 15 }, // Fecha
      { width: 10 }, // Hora
      { width: 25 }, // Paciente
      { width: 30 }, // Motivo
      { width: 30 }, // Diagnóstico
      { width: 25 }  // Tratamiento
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Médico');
    
    // Generar y descargar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  }
}