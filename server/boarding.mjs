import '../public/config.js';
const C=globalThis.CommuteConfig;
export function resolveVehicleScan(input,code,employee,now=new Date()){
 const s=C.normalizeState(input);let q;try{q=typeof code==='string'?JSON.parse(code):code}catch{throw Error('請掃描車上的交通車 QR Code')}
 if(!C.employeeValid(employee)||!q||q.kind!=='commute-vehicle'||q.version!==2)throw Error('車輛碼或同仁資料不正確');
 const r=s.routes.find(x=>x.id===q.route),v=r?.vehicles.find(x=>x.id===q.vehicle);
 if(!v?.scanTokens?.[q.billingCategory]||v.scanTokens[q.billingCategory]!==q.token)throw Error('車輛碼無效或已停用');
 const {date,time}=C.parts(now),p=C.policy(r.id,q.billingCategory,s,date.slice(0,7)),dir=Number(time.slice(0,2))<12?'go':'back';
 if(C.monthLockReason(s,date.slice(0,7)))throw Error(C.monthLockReason(s,date.slice(0,7)));
 if(!v.enabled||!C.active(r,dir)||s.closed.some(x=>x.route===r.id&&x.date===date&&x.dir===dir))throw Error('此方向班次未開行');
 const calendar=s.calendar.find(x=>x.date===date);if(calendar?calendar.type==='off':[0,6].includes(new Date(date+'T12:00Z').getUTCDay()))throw Error('今天依公司行事曆未開行');
 const check={employee,date,route:r.id,dir},prior=s.rides.find(x=>C.key(x)===C.key(check));
 if(!prior&&C.occupied(s,check))throw Error('本趟已有待審／核准補登，不能重複掃碼');
 return {...check,time,routeName:r.name,vehicle:v.id,vehicleName:v.name,billingCategory:q.billingCategory,categoryName:p.label,fare:p.fare,cap:p.cap,duplicate:!!prior,actions:prior?[]:['board']};
}
export function applyVehicleConfirmation(input,body,now=new Date()){
 const state=C.normalizeState(input),context=resolveVehicleScan(state,body.code,body.employee,now);
 if(body.action!=='board')throw Error('請確認上車');
 for(const k of ['date','dir','route','billingCategory'])if(body.expected?.[k]!==context[k])throw Error('班次或計費類別已更新，請重新掃碼確認');
 if(context.duplicate)return {state,context,duplicate:true};
 if(!C.text(body.name,60))throw Error('請填寫同仁姓名');
 state.rides.unshift({id:crypto.randomUUID(),employee:body.employee,name:body.name.trim(),date:context.date,time:context.time,route:context.route,dir:context.dir,billingCategory:context.billingCategory,fare:context.fare,vehicleId:context.vehicle,source:'scan',created:now.toISOString()});
 return {state,context,duplicate:false};
}

export function resolveSharedScan(input,code,employee,now=new Date(),selection){
 const s=C.normalizeState(input);let q;try{q=typeof code==='string'?JSON.parse(code):code}catch{throw Error('請掃描共用上車 QR Code')}
 if(!C.employeeValid(employee)||q?.kind!=='commute-shared'||q.version!==1||!s.boardingToken||q.token!==s.boardingToken)throw Error('共用上車碼無效，請使用新版共用碼');
 const {date,time}=C.parts(now),dir=Number(time.slice(0,2))<12?'go':'back',month=date.slice(0,7),base={employee,date,time,dir};
 if(C.monthLockReason(s,month))throw Error(C.monthLockReason(s,month));
 const same=x=>x.employee===employee&&x.date===date&&x.dir===dir;
 const prior=s.rides.find(same)||s.checkins.find(same);
 if(prior)return {...base,route:prior.route,billingCategory:prior.billingCategory,duplicate:true,actions:[]};
 if(s.adjustments.some(x=>same(x)&&x.status!=='rejected'))throw Error('此方向已有待審／核准補登，不能重複掃碼');
 const regs=s.registrations.filter(x=>x.employee===employee&&x.month===month);
 const option=x=>{const r=s.routes.find(r=>r.id===x.route),p=C.policy(x.route,x.billingCategory,s,month);return {route:x.route,routeName:r.name,billingCategory:x.billingCategory,categoryName:p.label,fare:p.fare,cap:p.cap}};
 if(regs.length>1&&!selection)return {...base,needsSelection:true,selectionType:'registered',multipleRegistered:true,duplicate:false,options:regs.map(option)};
 if(regs.length>1&&!regs.some(x=>x.route===selection.route&&x.billingCategory===selection.billingCategory))throw Error('請選擇本月已報名的路線與計費類別');
 const chosen=regs.length===1?regs[0]:selection;
 if(!chosen)return {...base,needsSelection:true,selectionType:'unregistered',duplicate:false,options:s.routes.filter(r=>C.active(r,dir)).flatMap(r=>C.categories(r.id).map(billingCategory=>{const p=C.policy(r.id,billingCategory,s,month);return {route:r.id,routeName:r.name,billingCategory,categoryName:p.label,fare:p.fare,cap:p.cap}}))};
 const r=s.routes.find(x=>x.id===chosen.route);if(!r||!C.active(r,dir)||s.closed.some(x=>x.route===r.id&&x.date===date&&x.dir===dir))throw Error('此方向班次未開行');
 const calendar=s.calendar.find(x=>x.date===date);if(calendar?calendar.type==='off':[0,6].includes(new Date(date+'T12:00Z').getUTCDay()))throw Error('今天依公司行事曆未開行');
 const p=C.policy(r.id,chosen.billingCategory,s,month);
 return {...base,route:r.id,routeName:r.name,billingCategory:chosen.billingCategory,categoryName:p.label,fare:p.fare,cap:p.cap,registered:!!regs.length,multipleRegistered:regs.length>1,duplicate:false,actions:['board']};
}
export function applySharedConfirmation(input,body,now=new Date()){
 const state=C.normalizeState(input),context=resolveSharedScan(state,body.code,body.employee,now,body.selection);
 if(body.action!=='board'||context.needsSelection)throw Error('請選擇路線並確認上車');
 if(context.duplicate)return {state,context,duplicate:true};
 for(const k of ['date','dir','route','billingCategory','fare','cap'])if(body.expected?.[k]!==context[k])throw Error('報名、班次或票價已更新，請重新掃碼確認');
 if(!C.text(body.name,60))throw Error('請填寫同仁姓名');
 state.rides.unshift({id:crypto.randomUUID(),employee:body.employee,name:body.name.trim(),date:context.date,time:context.time,route:context.route,dir:context.dir,billingCategory:context.billingCategory,fare:context.fare,source:'scan',boardingMode:'shared',created:now.toISOString()});
 return {state,context,duplicate:false};
}
