import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Lot, Supplier, MaterialType, Inspection } from '../types';
import type { SwitchingLevel } from '../types/switching';
import { SWITCHING_LEVEL_LABELS } from '../types/switching';
import { formatDate, formatDateTime } from '../data/samplingData';

interface PDFData {
  lot: Lot;
  supplier?: Supplier;
  material?: MaterialType;
  inspections: Inspection[];
  defectDistribution: { name: string; count: number }[];
  switchingLevel?: SwitchingLevel;
}

// Türkçe karakterleri ASCII eşdeğerlerine çevirme
// jsPDF varsayılan fontları Türkçe karakterleri desteklemediği için
function tr(text: string): string {
  const charMap: Record<string, string> = {
    'ı': 'i',
    'İ': 'I',
    'ğ': 'g',
    'Ğ': 'G',
    'ü': 'u',
    'Ü': 'U',
    'ş': 's',
    'Ş': 'S',
    'ö': 'o',
    'Ö': 'O',
    'ç': 'c',
    'Ç': 'C',
  };

  return text.replace(/[ığüşöçİĞÜŞÖÇ]/g, (char) => charMap[char] || char);
}

export async function generatePDF(data: PDFData): Promise<void> {
  const { lot, supplier, material, defectDistribution, switchingLevel } = data;

  // Birim belirleme - malzeme türüne göre
  const unit = material?.unit || 'adet';

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('GELEN MALZEME KALİTE KONTROL RAPORU'), pageWidth / 2, 20, {
    align: 'center',
  });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(tr('ISO 2859-1 Standardı'), pageWidth / 2, 28, { align: 'center' });

  // Report info
  doc.setFontSize(10);
  doc.text(`Rapor No: RPR-${lot.lotNumber}`, 14, 40);
  doc.text(`Tarih: ${formatDateTime(new Date())}`, pageWidth - 14, 40, {
    align: 'right',
  });

  // Lot Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Parti No: ${lot.lotNumber}`, 14, 50);

  // Supplier Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('TEDARİKÇİ BİLGİLERİ'), 14, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const supplierData = [
    [tr('Tedarikçi'), tr(supplier?.name || '-')],
    [tr('Sipariş No'), lot.orderNumber || '-'],
    ['Teslim Tarihi', formatDate(lot.receivedDate)],
  ];

  autoTable(doc, {
    startY: 65,
    head: [],
    body: supplierData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 },
    },
    margin: { left: 14 },
  });

  // Material Information
  const materialY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('MALZEME BİLGİLERİ'), 14, materialY);

  const materialData = [
    [tr('Malzeme Türü'), tr(material?.name || '-')],
    [tr('Parti Miktarı'), `${lot.quantity.toLocaleString('tr-TR')} ${unit}`],
  ];

  autoTable(doc, {
    startY: materialY + 3,
    head: [],
    body: materialData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 },
    },
    margin: { left: 14 },
  });

  // Sampling Parameters
  const samplingY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('ÖRNEKLEME PARAMETRELERİ'), 14, samplingY);

  // Switching seviye metni
  const switchingLevelText = switchingLevel
    ? tr(SWITCHING_LEVEL_LABELS[switchingLevel])
    : 'Normal';

  const samplingData = [
    ['Standart', 'ISO 2859-1'],
    ['Muayene Seviyesi', `Seviye ${lot.inspectionLevel}`],
    ['Kontrol Durumu', switchingLevelText],
    ['AQL', `%${lot.aql}`],
    [tr('Örneklem Kodu'), lot.sampleCode],
    [tr('Örneklem Büyüklüğü'), `${lot.sampleSize} ${unit}`],
    [tr('Kabul Sayısı (Ac)'), lot.acceptanceNumber.toString()],
    [tr('Red Sayısı (Re)'), lot.rejectionNumber.toString()],
  ];

  autoTable(doc, {
    startY: samplingY + 3,
    head: [],
    body: samplingData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 90 },
    },
    margin: { left: 14 },
  });

  // Control Results
  const resultsY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('KONTROL SONUÇLARI'), 14, resultsY);

  const uygunCount = lot.sampleSize - lot.defectCount;
  const controlData = [
    ['Kontrol Edilen', `${lot.sampleSize} ${unit}`],
    ['Uygun', `${uygunCount} ${unit}`],
    [tr('Hatalı'), `${lot.defectCount} ${unit}`],
  ];

  autoTable(doc, {
    startY: resultsY + 3,
    head: [],
    body: controlData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 },
    },
    margin: { left: 14 },
  });

  // Decision Box
  const decisionY = (doc as any).lastAutoTable.finalY + 10;
  const isAccepted = lot.decision === 'accepted';

  doc.setDrawColor(isAccepted ? 16 : 239, isAccepted ? 185 : 68, isAccepted ? 129 : 68);
  doc.setFillColor(isAccepted ? 236 : 254, isAccepted ? 253 : 242, isAccepted ? 245 : 242);
  doc.roundedRect(14, decisionY, pageWidth - 28, 20, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isAccepted ? 5 : 185, isAccepted ? 150 : 28, isAccepted ? 105 : 28);
  doc.text(
    tr(`KARAR: PARTİ ${isAccepted ? 'KABUL EDİLMİŞTİR' : 'REDDEDİLMİŞTİR'}`),
    pageWidth / 2,
    decisionY + 8,
    { align: 'center' }
  );
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    tr(`(${lot.defectCount} ${isAccepted ? '<=' : '>='} ${isAccepted ? lot.acceptanceNumber : lot.rejectionNumber}, Hatalı sayısı ${isAccepted ? 'kabul limitinde' : 'red limitini aştı'})`),
    pageWidth / 2,
    decisionY + 15,
    { align: 'center' }
  );

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Defect Distribution
  if (defectDistribution.length > 0) {
    // Hata dağılımı tablosunu yeni sayfada başlat
    doc.addPage();
    const defectY = 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(tr('HATA DAĞILIMI'), 14, defectY);

    const defectTableData = defectDistribution.map((item) => [
      tr(item.name),
      item.count.toString(),
      `%${((item.count / lot.defectCount) * 100).toFixed(1)}`,
    ]);

    defectTableData.push(['TOPLAM', lot.defectCount.toString(), '%100']);

    autoTable(doc, {
      startY: defectY + 3,
      head: [[tr('Hata Tipi'), 'Adet', 'Oran']],
      body: defectTableData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      margin: { left: 14 },
    });
  }

  // Signature Section
  const signatureY = Math.min((doc as any).lastAutoTable?.finalY + 20 || decisionY + 50, 250);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Signature boxes
  doc.text('Kontrol Eden:', 14, signatureY);
  doc.line(14, signatureY + 15, 80, signatureY + 15);
  doc.text(tr('İmza:'), 14, signatureY + 20);

  doc.text('Onaylayan:', 110, signatureY);
  doc.line(110, signatureY + 15, 176, signatureY + 15);
  doc.text(tr('İmza:'), 110, signatureY + 20);

  doc.text(`Tarih: ${formatDate(new Date())}`, 14, signatureY + 30);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    tr('Bu rapor ISO 2859-1 standartlarına uygun olarak hazırlanmıştır.'),
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // Save
  doc.save(`Kontrol_Raporu_${lot.lotNumber}.pdf`);
}

export async function generateBulkPDF(lots: Lot[], suppliers: Supplier[], materials: MaterialType[]): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('KALİTE KONTROL ÖZET RAPORU'), pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Oluşturulma Tarihi: ${formatDateTime(new Date())}`), pageWidth / 2, 28, {
    align: 'center',
  });

  // Summary stats
  const accepted = lots.filter((l) => l.decision === 'accepted').length;
  const rejected = lots.filter((l) => l.decision === 'rejected').length;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('GENEL ÖZET'), 14, 45);

  const summaryData = [
    ['Toplam Parti', lots.length.toString()],
    ['Kabul Edilen', accepted.toString()],
    ['Reddedilen', rejected.toString()],
    [tr('Kabul Oranı'), `%${lots.length > 0 ? ((accepted / lots.length) * 100).toFixed(1) : 0}`],
  ];

  autoTable(doc, {
    startY: 48,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 40 },
    },
    margin: { left: 14 },
  });

  // Lot list
  const listY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('PARTİ LİSTESİ'), 14, listY);

  const tableData = lots.map((lot) => {
    const supplier = suppliers.find((s) => s.id === lot.supplierId);
    const material = materials.find((m) => m.id === lot.materialTypeId);
    return [
      lot.lotNumber,
      supplier?.name || '-',
      tr(material?.name || '-'),
      lot.quantity.toLocaleString('tr-TR'),
      `${lot.defectCount}/${lot.sampleSize}`,
      lot.decision === 'accepted' ? 'KABUL' : lot.decision === 'rejected' ? 'RED' : '-',
      formatDate(lot.createdAt),
    ];
  });

  autoTable(doc, {
    startY: listY + 3,
    head: [[tr('Parti No'), tr('Tedarikçi'), 'Malzeme', 'Miktar', tr('Hatalı'), tr('Sonuç'), 'Tarih']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 14, right: 14 },
    columnStyles: {
      5: {
        fontStyle: 'bold',
      },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        if (data.cell.text[0] === 'KABUL') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (data.cell.text[0] === 'RED') {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    tr('Bu rapor ISO 2859-1 standartlarına uygun olarak hazırlanmıştır.'),
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  doc.save(`Kalite_Kontrol_Ozet_${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
}
