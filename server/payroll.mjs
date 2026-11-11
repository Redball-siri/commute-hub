import template from './payroll-template.json' with {type:'json'};
const encoder=new TextEncoder();
const xml=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
const bytes=s=>encoder.encode(s);
function crc32(b){let crc=0xffffffff;for(const n of b){crc^=n;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function header(size,values){const b=new Uint8Array(size),v=new DataView(b.buffer);for(const [offset,value,width] of values)width===2?v.setUint16(offset,value,true):v.setUint32(offset,value,true);return b}
function concat(chunks){const b=new Uint8Array(chunks.reduce((n,x)=>n+x.length,0));let p=0;for(const c of chunks){b.set(c,p);p+=c.length}return b}
// Preserve every template ZIP member, styles, hidden first row and print settings.
// ZIP STORE avoids Node-only compression dependencies inside Cloudflare Workers.
export function payrollXlsx(rows){
 const names=Object.keys(template),local=[],central=[];let offset=0;
 const dataRows=rows.map((x,i)=>{if(!/^[A-Za-z0-9_-]{1,40}$/.test(x.employee)||!/^\d{4}(0[1-9]|1[0-2])$/.test(x.yearMonth)||!Number.isSafeInteger(x.total)||x.total<0)throw Error('扣薪資料不正確');const n=i+4;return `<row r="${n}"><c r="A${n}" s="1" t="inlineStr"><is><t>${xml(x.employee)}</t></is></c><c r="B${n}" s="2" t="inlineStr"><is><t>${x.yearMonth}</t></is></c><c r="C${n}" s="2" t="n"><v>${x.total}</v></c></row>`}).join('');
 for(const name of names){let encoded=template[name];let b=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));if(name==='xl/worksheets/sheet1.xml'){const source=new TextDecoder().decode(b);b=bytes(source.replace('</sheetData>',dataRows+'</sheetData>').replace(/<dimension ref="[^"]*"\/>/,`<dimension ref="A1:C${Math.max(3,rows.length+3)}"/>`))}const n=bytes(name),crc=crc32(b),size=b.length;
 const h=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[8,0,2],[14,crc,4],[18,size,4],[22,size,4],[26,n.length,2]]);
 const c=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[10,0,2],[16,crc,4],[20,size,4],[24,size,4],[28,n.length,2],[42,offset,4]]);
 local.push(h,n,b);central.push(c,n);offset+=h.length+n.length+b.length;
 }
 const directory=concat(central),end=header(22,[[0,0x06054b50,4],[8,names.length,2],[10,names.length,2],[12,directory.length,4],[16,offset,4]]);return concat([...local,directory,end]);
}
