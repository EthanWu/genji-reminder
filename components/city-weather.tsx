"use client";
import {useEffect,useState} from 'react';
import {MapPin} from 'lucide-react';
export function CityWeather({city,day}:{city:string;day:string}){
 const [weather,setWeather]=useState('');
 useEffect(()=>{
   let active=true;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);setWeather('读取天气中');
   async function read(){
     const known:Record<string,number[]>={厦门:[24.48,118.09],北京:[39.9,116.4],上海:[31.23,121.47],深圳:[22.54,114.06],杭州:[30.27,120.15],广州:[23.13,113.26],成都:[30.57,104.07]};
     let coords=known[city];
     if(!coords){const g=await fetch('https://geocoding-api.open-meteo.com/v1/search?language=zh&count=1&name='+encodeURIComponent(city),{signal:controller.signal});const place=(await g.json() as {results?:{latitude:number;longitude:number}[]}).results?.[0];if(!place)throw Error();coords=[place.latitude,place.longitude]}
     const response=await fetch('https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code&latitude='+coords[0]+'&longitude='+coords[1],{signal:controller.signal});
     if(!response.ok)throw Error();const current=(await response.json() as {current:{temperature_2m:number;weather_code:number}}).current;if(!Number.isFinite(current?.temperature_2m))throw Error();
     const code=current.weather_code;const label=code===0?'晴':code<=3?'多云':code<=48?'雾':code>=95?'雷雨':(code>=71&&code<=77)||code>=85?'雪':'雨';
     if(active)setWeather(label+' '+Math.round(current.temperature_2m)+'°C');
   }
   read().catch(()=>{if(active)setWeather('天气暂不可用')}).finally(()=>clearTimeout(timer));
   return ()=>{active=false;clearTimeout(timer);controller.abort()};
 },[city,day]);
 return <span className="city-weather"><MapPin size={14}/> Genji · {city}<a title="天气数据来自 Open-Meteo" href="https://open-meteo.com/" target="_blank" rel="noreferrer">{weather}</a></span>
}
