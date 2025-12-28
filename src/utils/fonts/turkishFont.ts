// Türkçe karakter desteği için jsPDF font konfigürasyonu
// Bu dosya, jsPDF'e Türkçe karakterleri düzgün gösterebilen font ekler

import jsPDF from 'jspdf';

// Türkçe karakterleri destekleyen fontu yükle
// Not: jsPDF varsayılan fontları Türkçe karakterleri desteklemez
// Bu yüzden özel font eklememiz gerekiyor

// Basit çözüm: Türkçe karakterleri ASCII eşdeğerlerine çevirme fonksiyonu
// Bu geçici bir çözümdür, asıl çözüm özel font eklemektir
export function turkishToAscii(text: string): string {
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

// jsPDF'e Türkçe font ekleme fonksiyonu
// Bu fonksiyon, doküman oluşturulmadan önce çağrılmalıdır
export async function addTurkishFont(doc: jsPDF): Promise<void> {
  // Roboto fontunu CDN'den yükle
  try {
    const fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff';

    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.warn('Font yüklenemedi, varsayılan font kullanılacak');
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Fontu jsPDF'e ekle
    doc.addFileToVFS('Roboto-Regular.ttf', base64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (error) {
    console.warn('Font yüklenirken hata oluştu:', error);
  }
}

// Alternatif: Gömülü font kullanımı
// Bu yöntem daha güvenilir çünkü harici bağlantıya ihtiyaç duymaz
// Ancak dosya boyutu büyür

// Türkçe metin düzeltme fonksiyonu
// Font yüklenemezse bu fonksiyon kullanılır
export function fixTurkishText(text: string, useAscii: boolean = false): string {
  if (useAscii) {
    return turkishToAscii(text);
  }
  return text;
}
