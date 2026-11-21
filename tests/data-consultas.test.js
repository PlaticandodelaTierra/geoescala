// Pruebas de las consultas sobre las unidades (src/data.js).
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import {
  buscarUnidades,
  hijosDe,
  intervaloDeUnidades,
  normalizarTexto,
  unidadesDelRango,
  unidadPorId,
} from '../src/data.js';

const unidades = datos.unidades;
const ids = (lista) => lista.map((u) => u.id);

describe('consultas básicas', () => {
  it('unidadPorId', () => {
    expect(unidadPorId(unidades, 'epoca-mioceno').nombre_es).toBe('Mioceno');
    expect(unidadPorId(unidades, 'no-existe')).toBeNull();
  });

  it('unidadesDelRango, de la más joven a la más antigua', () => {
    const periodos = unidadesDelRango(unidades, 'periodo');
    expect(periodos).toHaveLength(22);
    expect(periodos[0].id).toBe('periodo-cuaternario');
    expect(periodos.at(-1).id).toBe('periodo-sideriano');
  });

  it('hijosDe', () => {
    expect(ids(hijosDe(unidades, 'epoca-holoceno'))).toEqual([
      'piso-megalayiano',
      'piso-norgripiano',
      'piso-groenlandiano',
    ]);
    expect(hijosDe(unidades, 'eon-hadeano')).toEqual([]);
  });
});

describe('búsqueda por nombre', () => {
  it('normaliza acentos, mayúsculas y espacios', () => {
    expect(normalizarTexto('  Cretácico   SUPERIOR ')).toBe('cretacico superior');
    expect(normalizarTexto('Época')).toBe('epoca');
  });

  it('encuentra sin acentos y en español o inglés', () => {
    expect(buscarUnidades(unidades, 'cretacico')[0].id).toBe('periodo-cretacico');
    expect(buscarUnidades(unidades, 'Cretaceous')[0].id).toBe('periodo-cretacico');
    expect(buscarUnidades(unidades, 'MIOCENO')[0].id).toBe('epoca-mioceno');
    expect(buscarUnidades(unidades, 'miocene')[0].id).toBe('epoca-mioceno');
    expect(ids(buscarUnidades(unidades, 'megalayano'))).toEqual([]);
    expect(ids(buscarUnidades(unidades, 'meghala'))).toEqual(['piso-megalayiano']); // Meghalayan
  });

  it('primero el rango mayor y, dentro del rango, lo más joven', () => {
    expect(ids(buscarUnidades(unidades, 'cretacico'))).toEqual([
      'periodo-cretacico',
      'epoca-cretacico-superior',
      'epoca-cretacico-inferior',
    ]);
  });

  it('primero los nombres que empiezan con el texto, luego palabras y al final el resto', () => {
    const r = ids(buscarUnidades(unidades, 'ceno', { limite: 50 }));
    expect(r[0]).toBe('era-cenozoico'); // empieza con "ceno"
    expect(r).toContain('epoca-mioceno'); // lo contiene
    expect(r.indexOf('era-cenozoico')).toBeLessThan(r.indexOf('epoca-mioceno'));

    const s = ids(buscarUnidades(unidades, 'superior', { limite: 50 }));
    expect(s).toContain('epoca-cretacico-superior'); // palabra que empieza con "superior"
    expect(s).toContain('piso-pleistoceno-superior');
  });

  it('respeta el límite y no busca con texto vacío', () => {
    expect(buscarUnidades(unidades, 'a', { limite: 5 })).toHaveLength(5);
    expect(buscarUnidades(unidades, '')).toEqual([]);
    expect(buscarUnidades(unidades, '   ')).toEqual([]);
  });
});

describe('intervalo entre dos unidades', () => {
  it('va del techo de la más joven a la base de la más antigua, en cualquier orden', () => {
    const esperado = { techo_ma: 0, base_ma: 23.04 };
    expect(intervaloDeUnidades(unidades, 'epoca-mioceno', 'epoca-holoceno')).toEqual(esperado);
    expect(intervaloDeUnidades(unidades, 'epoca-holoceno', 'epoca-mioceno')).toEqual(esperado);
  });

  it('una sola unidad da su propio intervalo', () => {
    expect(intervaloDeUnidades(unidades, 'periodo-neogeno', 'periodo-neogeno')).toEqual({
      techo_ma: 2.58,
      base_ma: 23.04,
    });
  });

  it('si una unidad contiene a la otra, da la mayor', () => {
    expect(intervaloDeUnidades(unidades, 'era-cenozoico', 'epoca-mioceno')).toEqual({ techo_ma: 0, base_ma: 66 });
  });

  it('regresa null si una unidad no existe', () => {
    expect(intervaloDeUnidades(unidades, 'era-cenozoico', 'no-existe')).toBeNull();
  });
});
