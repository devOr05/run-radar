import React, { useState } from 'react';
import { 
  Smartphone, 
  Heart, 
  Watch, 
  Compass, 
  Footprints, 
  Flame, 
  BatteryCharging, 
  Check, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';

interface DeviceGuideContentProps {
  initialCategory?: 'cellular' | 'xiaomi' | 'amazfit' | 'garmin' | 'straps' | 'apple';
}

export const DeviceGuideContent: React.FC<DeviceGuideContentProps> = ({
  initialCategory = 'cellular'
}) => {
  const [activeTab, setActiveTab] = useState<'cellular' | 'xiaomi' | 'amazfit' | 'garmin' | 'straps' | 'apple'>(initialCategory);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Selector de Dispositivo / Categoría */}
      <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('cellular')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'cellular'
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>1. Solo Celular (0$)</span>
        </button>

        <button
          onClick={() => setActiveTab('xiaomi')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'xiaomi'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Watch className="w-3.5 h-3.5 text-orange-400" />
          <span>2. Xiaomi Smart Band</span>
        </button>

        <button
          onClick={() => setActiveTab('amazfit')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'amazfit'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Watch className="w-3.5 h-3.5 text-cyan-400" />
          <span>3. Amazfit (Zepp OS)</span>
        </button>

        <button
          onClick={() => setActiveTab('garmin')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'garmin'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Watch className="w-3.5 h-3.5 text-blue-400" />
          <span>4. Garmin</span>
        </button>

        <button
          onClick={() => setActiveTab('straps')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'straps'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>5. Bandas de Pecho</span>
        </button>

        <button
          onClick={() => setActiveTab('apple')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'apple'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Watch className="w-3.5 h-3.5 text-purple-400" />
          <span>6. Apple & WearOS</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
        
        {/* TAB 1: SOLO CELULAR */}
        {activeTab === 'cellular' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300 mb-1">
                  Modo "Solo Celular": Cero costo, cero accesorios extra
                </h3>
                <p className="text-xs text-slate-300">
                  RunRadar está pensado para corredores principiantes y aficionados. Si no tienes reloj ni pulsómetro, <strong>no necesitas gastar nada</strong>: tu propio teléfono calcula todas las métricas en vivo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>GPS de Alta Precisión</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Mide distancia (km), ritmo por km (min/km), velocidad instantánea y dibuja tu traza en tiempo real en el mapa satelital del entrenador.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Footprints className="w-4 h-4 text-yellow-400" />
                  <span>Podómetro & Cadencia (SPM)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  El acelerómetro de tu teléfono detecta cada paso y calcula tu cadencia (pasos por minuto) con precisión milimétrica mientras corres.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Calorías Quemadas</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Calcula el gasto calórico continuo estimado (~65-70 kcal por km recorrido).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <BatteryCharging className="w-4 h-4 text-cyan-400" />
                  <span>Nivel de Batería en Vivo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tu profesor puede ver cuánta batería le queda a tu celular para evitar que te quedes sin carga en salidas largas.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="font-bold text-white block mb-1">💡 ¿Cómo salir a correr con el celular?</span>
              <p className="text-slate-400">
                Lleva el teléfono en un brazalete deportivo, riñonera de running o en el bolsillo de tu pantalón. Instala RunRadar desde el botón <strong>"📲 Instalar App (PWA)"</strong> para que corra fluido en pantalla completa.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: XIAOMI SMART BAND */}
        {activeTab === 'xiaomi' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-300 mb-1">
                  Xiaomi Smart Band (Mi Band 4, 5, 6, 7, 8, 9)
                </h3>
                <p className="text-xs text-slate-300">
                  Es la pulsera más vendida entre corredores amateurs. Según el modelo, puedes conectarla directo o con una app puente.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    CONEXIÓN DIRECTA NATIVA
                  </span>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Mi Band 4, 5, 6 y 7 (Con app Zepp Life o Mi Fit)
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  Tienen de fábrica una opción para emitir el pulso por Bluetooth abierto:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 pl-1">
                  <li>Abre la aplicación <strong>Zepp Life</strong> (o <em>Mi Fit</em>) en tu móvil.</li>
                  <li>Ve a <strong>Perfil ➔ Mi Band</strong>.</li>
                  <li>Activa la casilla <strong>"Compartir frecuencia cardíaca"</strong> (o <em>"Hacer visible"</em>).</li>
                  <li>Vuelve a RunRadar, toca <strong>"Conectar Sensor"</strong> y selecciona tu pulsera. ¡El pulso aparecerá en vivo!</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                    MODELOS MI FITNESS
                  </span>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Mi Band 8 y 9 (Con app Mi Fitness)
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  En los modelos 8 y 9, Xiaomi cerró la emisión nativa en su nueva app. Para usarlas tienes 2 caminos simples:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-400 text-xs block mb-1">Opción A: App Puente (Android)</span>
                    <p className="text-[11px] text-slate-400">
                      Instala <strong>"Notify for Xiaomi"</strong> desde Google Play. Activa <em>"Transmitir ritmo cardíaco por Bluetooth (BLE)"</em>. RunRadar detectará la señal retransmitida en tiempo real.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-emerald-400 text-xs block mb-1">Opción B: Modo Solo Celular (Sin líos)</span>
                    <p className="text-[11px] text-slate-400">
                      Corre con tu teléfono en el bolsillo (RunRadar mide GPS, ritmo, pasos y cadencia), y usa la Mi Band en tu muñeca para tu referencia personal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AMAZFIT */}
        {activeTab === 'amazfit' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-1">
                  Amazfit (Zepp OS: Bip 5, Bip 6, Active, Cheetah, Balance, T-Rex)
                </h3>
                <p className="text-xs text-slate-300">
                  Compatibilidad excelente gracias a su sistema operativo Zepp OS y su tienda de mini aplicaciones.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Para Amazfit Bip 5 / Bip 6 / Active:
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Usar la app gratuita "Pulsómetro" del reloj
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 pl-1">
                  <li>Abre la aplicación <strong>Zepp</strong> en tu celular.</li>
                  <li>Ve a <strong>Perfil ➔ Tu Reloj ➔ Tienda de aplicaciones</strong>.</li>
                  <li>Busca e instala la app <strong>"Pulsómetro"</strong> (o <em>"Heart Rate Broadcast"</em>). Es 100% gratuita.</li>
                  <li>Abre la app en la pantalla del reloj antes de entrenar.</li>
                  <li>En RunRadar, pulsa <strong>"Conectar Sensor"</strong> y selecciona tu Amazfit. ¡Transmite al instante!</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Para Amazfit Cheetah / Balance / T-Rex 3:
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Transmisión de FC Nativa
                </h4>
                <p className="text-xs text-slate-400">
                  En el reloj ve a <strong>Ajustes ➔ Entrenamiento / Pulso ➔ Transmisión de Frecuencia Cardíaca</strong>. Actívala y conéctate directo a RunRadar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GARMIN */}
        {activeTab === 'garmin' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-300 mb-1">
                  Garmin (Forerunner, Fénix, Instinct, Venu, Vivoactive)
                </h3>
                <p className="text-xs text-slate-300">
                  Todos los relojes Garmin cuentan de fábrica con el estándar abierto para emitir pulso sin instalar apps.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Cómo activar "Transmitir Frecuencia Cardíaca" (Broadcast HR):
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400 pl-1">
                <li>
                  En tu reloj Garmin, mantén pulsado el botón <strong>UP / Menú</strong>.
                </li>
                <li>
                  Entra a <strong>Ajustes ➔ Frecuencia Cardíaca en la Muñeca</strong> (o <em>Sensores y Accesorios</em>).
                </li>
                <li>
                  Toca <strong>Transmitir FC</strong> y pulsa <strong>Iniciar</strong>.
                </li>
                <li>
                  En RunRadar, pulsa <strong>"Conectar Sensor"</strong> y selecciona tu reloj Garmin.
                </li>
              </ol>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                💡 <strong>Consejo:</strong> En Garmin puedes activar la opción <em>"Transmitir durante actividad"</em> para no tener que activarlo manualmente cada día.
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BANDAS DE PECHO */}
        {activeTab === 'straps' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-300 mb-1">
                  Bandas de Pecho & Sensores Ópticos de Brazo
                </h3>
                <p className="text-xs text-slate-300">
                  Magene H64, CooSpo H6/H8, Polar H9/H10/Verity, XOSS, Decathlon Kalenji, Garmin HRM.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  100% COMPATIBLE • RECOMENDADO
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Estándar Universal Bluetooth SIG (0x180D)
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Es la opción más económica ($18 a $30 USD) y con la mayor precisión cardíaca posible para un corredor.
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 pl-1">
                <li>Humedece los electrodos de goma de la banda con un poco de agua o saliva.</li>
                <li>Ajusta la banda al pecho justo por debajo del esternón.</li>
                <li>En la pantalla de RunRadar pulsa <strong>"Conectar Sensor"</strong>.</li>
                <li>Elige tu banda en el cuadro de búsqueda y listo, se conecta en 1 segundo.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 6: APPLE & WEAR OS */}
        {activeTab === 'apple' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-300 mb-1">
                  Apple Watch (iPhone) y Samsung Galaxy Watch (Wear OS)
                </h3>
                <p className="text-xs text-slate-300">
                  Aclaraciones sobre los sistemas cerrados de Apple y Google.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  📱 Para usuarios de iPhone (iOS / Safari):
                </h4>
                <p className="text-xs text-slate-300">
                  En iPhone, RunRadar funciona al <strong>100% en modo "Solo Celular"</strong>: mide GPS, velocidad, ritmo, distancia, cadencia y pasos con los sensores del propio teléfono.
                </p>
                <p className="text-xs text-slate-400">
                  <em>Aviso de Apple:</em> El navegador Safari no permite enlazar accesorios Bluetooth directamente a páginas web. Si deseas conectar una banda de pecho a RunRadar desde un iPhone, abre la página utilizando el navegador gratuito <strong>"Bluefy"</strong> de la App Store.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  ⌚ Apple Watch y Galaxy Watch:
                </h4>
                <p className="text-xs text-slate-400">
                  Requieren apps nativas instaladas desde sus tiendas. Para corredores amateurs, la recomendación principal es entrenar en <strong>modo Solo Celular</strong>, teniendo todas las métricas en directo sin complicaciones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acordeón de Preguntas Frecuentes */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preguntas Frecuentes de la App</span>
          </h4>

          <div className="space-y-1.5 text-xs">
            <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
                className="w-full p-3 text-left font-semibold text-slate-300 flex items-center justify-between hover:text-white"
              >
                <span>¿Qué pasa si no tengo entrenador ni grupo? (Modo Libre)</span>
                {expandedFaq === 1 ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedFaq === 1 && (
                <div className="p-3 pt-0 text-slate-400 text-xs border-t border-slate-800/40">
                  RunRadar incluye el <strong>"Modo Libre"</strong>. Entrenas por tu cuenta con GPS, ritmo, pulso y cadencia privados en tu teléfono. Si más adelante te sumas a un grupo o profesor, solo escaneas su código QR y te integras al pelotón de inmediato.
                </div>
              )}
            </div>

            <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
                className="w-full p-3 text-left font-semibold text-slate-300 flex items-center justify-between hover:text-white"
              >
                <span>¿Cuánto consume de batería e internet?</span>
                {expandedFaq === 2 ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedFaq === 2 && (
                <div className="p-3 pt-0 text-slate-400 text-xs border-t border-slate-800/40">
                  El consumo es mínimo: los paquetes de telemetría son ultra comprimidos (menos de 1 MB por hora). La batería rinde varias horas continuas de carrera.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
