import React from 'react';
import { useAppContext } from '../AppContext';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function EventResultScreen() {
  const { activeEvent, eventFeedback, minigameContext, player, proceedToNextScreen } = useAppContext();
  return (
          <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#22E748]">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-6 sports-font tracking-tighter">THE VERDICT</h2>
            <p className="text-lg sm:text-xl italic text-slate-300 mb-8 max-w-2xl mx-auto text-center font-sans">"{eventFeedback}"</p>

            <div className="sticky bottom-0 left-0 w-full pt-4 pb-2 bg-gradient-to-t from-[#040505] via-[#040505] to-transparent z-40 mt-4">
               <button onClick={() => proceedToNextScreen(activeEvent, minigameContext, player)} className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest w-full sm:w-auto shadow-2xl">
                 CONTINUE CAREER ➔
               </button>
            </div>
          </div>
        );
}
