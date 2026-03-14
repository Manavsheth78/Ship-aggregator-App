import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LABELS_DIR = process.env.LABELS_DIR || path.join(__dirname, '../../labels');
const FALLBACK_DIR = process.env.TMP || process.env.TEMP || path.join(__dirname, '../../labels');

export function getLabelsDir() {
  const dir = LABELS_DIR || FALLBACK_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function generateShippingLabel(shipment) {
  const dir = getLabelsDir();
  const filename = `label-${shipment.tracking_number}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);
  const doc = new PDFDocument({ margin: 50 });

  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  doc.fontSize(20).fillColor('#1B5E20').text('Smart Shipment', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#333').text('Shipping Label', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#1B5E20').text(`Tracking # ${shipment.tracking_number}`);
  doc.fontSize(9).fillColor('#666').text(`Created: ${new Date(shipment.created_at).toLocaleString()}`);
  doc.fontSize(9).fillColor('#666').text(`Carrier: ${shipment.carrier || 'DEMO'}`);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor('#333').text('FROM (Sender)', { continued: false });
  doc.fontSize(10).text(shipment.sender_name || '');
  doc.text(shipment.sender_address || '');
  doc.text(`${shipment.sender_city || ''}, ${shipment.sender_state || ''}`);
  doc.moveDown(1);

  doc.fontSize(11).fillColor('#333').text('TO (Receiver)', { continued: false });
  doc.fontSize(10).text(shipment.receiver_name || '');
  doc.text(shipment.receiver_address || '');
  doc.text(`${shipment.receiver_city || ''}, ${shipment.receiver_state || ''}`);
  doc.moveDown(1);

  doc.fontSize(11).fillColor('#333').text('Package Details', { continued: false });
  doc.fontSize(10).text(`Type: ${shipment.package_type || 'N/A'}`);
  doc.text(`Weight: ${shipment.package_weight} lb | Dimensions: ${shipment.package_length}" x ${shipment.package_width}" x ${shipment.package_height}"`);
  doc.moveDown(0.5);

  doc.fontSize(8).fillColor('#999').text('Smart Shipment Monitoring System', { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}
