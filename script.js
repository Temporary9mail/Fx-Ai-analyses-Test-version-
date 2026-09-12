const input=document.getElementById("chartInput");
const preview=document.getElementById("preview");
const previewWrap=document.getElementById("previewWrap");
const analyzeBtn=document.getElementById("analyzeBtn");
const removeBtn=document.getElementById("removeBtn");
let selectedFile=null;

input.addEventListener("change",()=>{
  selectedFile=input.files?.[0]||null;
  if(!selectedFile)return;
  const url=URL.createObjectURL(selectedFile);
  preview.src=url;
  previewWrap.classList.remove("hidden");
  analyzeBtn.disabled=false;
});

removeBtn.addEventListener("click",()=>{
  selectedFile=null; input.value=""; preview.src="";
  previewWrap.classList.add("hidden"); analyzeBtn.disabled=true;
  document.getElementById("result").classList.add("hidden");
});

analyzeBtn.addEventListener("click",async()=>{
  if(!selectedFile)return;
  analyzeBtn.disabled=true;
  analyzeBtn.textContent="Analyzing…";
  try{
    const data=await analyzeImage(selectedFile);
    renderResult(data);
  }catch(err){
    renderResult({
      market:"Unknown market",signal:"WAIT",confidence:0,
      timeframe:"Unknown",marketType:"Unknown",trend:"Unable to verify",
      dataStatus:"Error",reason:err.message||"Analysis failed."
    });
  }finally{
    analyzeBtn.disabled=false;
    analyzeBtn.textContent="Analyze Market";
  }
});

/*
  This browser-only version performs a transparent heuristic chart read:
  it does NOT pretend that Twelve Data can analyze an image. Twelve Data
  provides market data, while screenshot interpretation needs a vision model
  or backend service.

  To connect an AI vision API later, replace analyzeImage() with your own
  secure backend call. The UI and result rendering are already prepared.
*/
async function analyzeImage(file){
  const img=await loadImage(file);
  const canvas=document.createElement("canvas");
  const max=900, scale=Math.min(1,max/Math.max(img.width,img.height));
  canvas.width=Math.max(1,Math.round(img.width*scale));
  canvas.height=Math.max(1,Math.round(img.height*scale));
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;

  // Basic visual estimate: compares colored pixel balance in the lower 75%.
  // This is only a demo and should not be presented as guaranteed AI accuracy.
  let up=0,down=0;
  for(let i=0;i<pixels.length;i+=16){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    if(g>r*1.18 && g>b*1.05)up++;
    if(r>g*1.18 && r>b*1.05)down++;
  }
  const total=up+down;
  let signal="WAIT",confidence=50,trend="Mixed / unclear";
  if(total>25){
    const ratio=Math.max(up,down)/total;
    if(ratio>=.58){
      signal=up>down?"UP":"DOWN";
      confidence=Math.min(92,Math.round(55+(ratio-.5)*100));
      trend=signal==="UP"?"Bullish visual bias":"Bearish visual bias";
    }else{
      confidence=50; trend="Mixed / unclear";
    }
  }

  const textHint=await optionalDataCheck();
  return {
    market:detectMarketName(),
    signal,confidence,
    timeframe:detectTimeframe(),
    marketType:"Trading chart",
    trend,
    dataStatus:textHint,
    reason:`Screenshot visual scan suggests a ${trend.toLowerCase()}. This is a heuristic demo result, not a verified prediction. For reliable analysis, connect a vision-capable AI backend plus live OHLC data.`
  };
}

function loadImage(file){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error("Could not read the uploaded image."));
    img.src=URL.createObjectURL(file);
  });
}

function detectMarketName(){
  // A screenshot's text cannot be reliably OCR'd by plain browser JS.
  // Return a clear label rather than inventing a symbol.
  return "Market detected from chart (OCR/API required)";
}
function detectTimeframe(){return "Detected from chart (OCR required)"}

async function optionalDataCheck(){
  const key=window.APP_CONFIG?.TWELVE_DATA_API_KEY;
  if(!key)return "Screenshot only";
  // We intentionally do not guess a symbol from the image.
  return "Twelve Data key loaded — symbol required for live-data lookup";
}

function renderResult(d){
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("marketName").textContent=d.market;
  const s=document.getElementById("signal");
  s.textContent=d.signal; s.className="signal "+(d.signal==="UP"?"up":d.signal==="DOWN"?"down":"");
  document.getElementById("confidenceValue").textContent=d.confidence+"%";
  document.getElementById("barFill").style.width=Math.max(0,Math.min(100,d.confidence))+"%";
  document.getElementById("timeframe").textContent=d.timeframe;
  document.getElementById("marketType").textContent=d.marketType;
  document.getElementById("trend").textContent=d.trend;
  document.getElementById("dataStatus").textContent=d.dataStatus;
  document.getElementById("reasonText").textContent=d.reason;
}
