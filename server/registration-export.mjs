const encoder=new TextEncoder();
const xml=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
const bytes=s=>encoder.encode(s);
function crc32(b){let crc=0xffffffff;for(const n of b){crc^=n;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function header(size,values){const b=new Uint8Array(size),v=new DataView(b.buffer);for(const [offset,value,width] of values)width===2?v.setUint16(offset,value,true):v.setUint32(offset,value,true);return b}
function concat(chunks){const b=new Uint8Array(chunks.reduce((n,x)=>n+x.length,0));let p=0;for(const c of chunks){b.set(c,p);p+=c.length}return b}

export function registrationXlsx(state,month){
 const headers=['報名月份','工號','姓名','路線','計費類別','報名時間（台灣時間）'];
 const rows=state.registrations.filter(x=>x.month===month).sort((a,b)=>a.route.localeCompare(b.route)||a.employee.localeCompare(b.employee)).map(x=>{const route=state.routes.find(r=>r.id===x.route);const date=new Date(x.created);return [month,x.employee,x.name,route?.name||x.route,x.billingCategory==='linkou'?'林口':x.billingCategory==='nankan'?'南崁':'一般',Number.isNaN(date.getTime())?'未記錄':new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date)]});
 const data=[headers,...rows].map((row,i)=>`<row r="${i+1}">${row.map((value,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xml(value??'')}</t></is></c>`).join('')}</row>`).join('');
 const files={
 '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="月度報名名單" sheetId="1" r:id="rId1"/></sheets></workbook>',
 'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:F${rows.length+1}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="16" customWidth="1"/><col min="3" max="5" width="22" customWidth="1"/><col min="6" max="6" width="28" customWidth="1"/></cols><sheetData>${data}</sheetData><autoFilter ref="A1:F${rows.length+1}"/></worksheet>`};
 const local=[],central=[];let offset=0;
 for(const [name,text] of Object.entries(files)){const b=bytes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+text),n=bytes(name),crc=crc32(b),size=b.length;
 const h=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[8,0,2],[14,crc,4],[18,size,4],[22,size,4],[26,n.length,2]]);
 const c=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[10,0,2],[16,crc,4],[20,size,4],[24,size,4],[28,n.length,2],[42,offset,4]]);
 local.push(h,n,b);central.push(c,n);offset+=h.length+n.length+b.length;}
 const directory=concat(central),end=header(22,[[0,0x06054b50,4],[8,central.length/2,2],[10,central.length/2,2],[12,directory.length,4],[16,offset,4]]);return concat([...local,directory,end]);
}
