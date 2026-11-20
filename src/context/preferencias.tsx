import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { gravarConfig, lerConfig } from '@/db/database';

/** Preferencia de acessibilidade: "texto grande" aumenta todas as fontes do app (salvo no banco). */
interface Preferencias {
  textoGrande: boolean;
  alternarTextoGrande: () => void;
  fs: (tamanho: number) => number; // aplica a escala escolhida
}

const Ctx = createContext<Preferencias>({ textoGrande: false, alternarTextoGrande: () => {}, fs: (t) => t });

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [textoGrande, setTextoGrande] = useState(false);

  useEffect(() => {
    lerConfig('texto_grande').then((v) => setTextoGrande(v === '1'));
  }, []);

  const alternarTextoGrande = () => {
    const novo = !textoGrande;
    setTextoGrande(novo);
    gravarConfig('texto_grande', novo ? '1' : '0');
  };

  return (
    <Ctx.Provider value={{ textoGrande, alternarTextoGrande, fs: (t) => Math.round(t * (textoGrande ? 1.3 : 1)) }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePreferencias = () => useContext(Ctx);
