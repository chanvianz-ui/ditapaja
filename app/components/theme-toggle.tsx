"use client";
import {useEffect,useState} from "react";
import {Moon,Sun} from "lucide-react";
export default function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{const current=document.documentElement.dataset.theme==="dark";setDark(current)},[]);
 function toggleTheme(){const next=!dark;setDark(next);const value=next?"dark":"light";document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;try{localStorage.setItem("ditapaja-theme",value)}catch{}}
 return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={dark?"Aktifkan mode terang":"Aktifkan mode gelap"} title={dark?"Mode terang":"Mode gelap"}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?"Terang":"Gelap"}</span></button>
}
