/* Timetable estimates only. Never infer missing return-stop times. */
globalThis.CommuteProgress={estimate(state,route,now=new Date(),direction='auto'){
 const C=globalThis.CommuteConfig,{date,time}=C.parts(now),dir=direction==='auto'?(Number(time.slice(0,2))<12?'go':'back'):direction,plan=globalThis.CommuteCalendar.schedule(state,date).find(x=>x.route===route.id),factory={name:'楊梅工廠',time:dir==='go'?route.arrival:plan?.back||route.back};
 const stops=dir==='go'?[...route.stops.map(s=>({name:s[1],time:s[0]})),factory]:[factory,...[...route.stops].reverse().map(s=>({name:s[1],time:s[4]||null}))];
 const running=!!plan&&(dir==='go'?plan.go:plan.return)&&plan.vehicles>0;
 let active=-1,status='今日此班次不開行',mode='off';
 if(running){const first=stops[0].time;if(time<first){status='尚未發車 · '+first+' 發車';mode='waiting'}else{for(let i=0;i<stops.length;i++)if(stops[i].time&&stops[i].time<=time)active=i;const missing=dir==='back'&&stops.some(s=>!s.time);if(missing){active=-1;mode='unknown';status='已發車 · 回程各站進度待確認'}else if(active===stops.length-1){mode='arrived';status=dir==='go'?'預計已抵達工廠':'預計已抵達終點站'}else{mode='moving';status='預計到達 '+stops[active].name}}}
 return {date,time,dir,mode,status,active,stops:stops.map((s,i)=>({...s,state:mode==='off'?'off':mode==='unknown'?(i===0?'passed':'unknown'):i===active?'current':active>=0&&i<active?'passed':'upcoming'}))};
}};
