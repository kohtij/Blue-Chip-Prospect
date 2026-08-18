// React Context that carries App's state, setters, and handlers to every screen.
// Screens read via useAppContext(); App.jsx wraps <AppContext.Provider value={...}>
// around the render root.
//
// Note: putting all App state in one context object means every state change
// re-renders every consumer, but since state lives at the App level already,
// consumers were re-rendering on every parent update anyway. No performance
// regression versus the prop-drilling that preceded this.
import { createContext, useContext } from 'react';

export const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);
