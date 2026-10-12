import type { ImageJob } from '../types';

function escapeCsvField(field: string): string {
  // If the field contains a comma, double quote, or newline, enclose it in double quotes.
  if (/[",\n]/.test(field)) {
    // Within a double-quoted field, any double quote must be escaped by another double quote.
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportJobsToCSV(jobs: ImageJob[]): void {
  const completedJobs = jobs.filter(job => job.status === 'completed' && job.data);

  if (completedJobs.length === 0) {
    alert("Nenhum dado completo para exportar.");
    return;
  }

  // Cabeçalho oficial compatível com o portal de colaboradores do Adobe Stock
  const headers = ['Filename', 'Title', 'Keywords', 'Category'];
  
  const rows = completedJobs.map(job => {
    const filename = escapeCsvField(job.file.name);
    const title = escapeCsvField(job.data!.title);
    const keywords = escapeCsvField(job.data!.keywords.join(', '));
    // Categoria numérica oficial de 1 a 21
    const category = job.data!.category ? String(job.data!.category) : '';
    
    return [filename, title, keywords, category].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('download', `adobe-stock-metadata-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
