import jsQR from 'jsqr';
import QRCode from 'qrcode';
globalThis.CommuteQr={decode:jsQR,render:(canvas,text)=>QRCode.toCanvas(canvas,text,{width:320,margin:3,errorCorrectionLevel:'M'})};
