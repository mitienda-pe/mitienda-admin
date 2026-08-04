import { describe, it, expect } from 'vitest'
import { parseCsvString, parseCsvNumber, detectCsvDelimiter } from '../csv-helpers'

describe('detectCsvDelimiter', () => {
  it('detecta coma', () => {
    expect(detectCsvDelimiter('id,nombre,sku,precio,stock')).toBe(',')
  })

  it('detecta punto y coma (Excel es-PE)', () => {
    expect(detectCsvDelimiter('id;nombre;sku;precio;stock')).toBe(';')
  })

  it('detecta tabulador', () => {
    expect(detectCsvDelimiter('id\tnombre\tsku')).toBe('\t')
  })

  it('cae a coma con una sola columna', () => {
    expect(detectCsvDelimiter('sku')).toBe(',')
  })
})

describe('parseCsvString', () => {
  it('parsea el CSV separado por coma', () => {
    const { headers, rows, delimiter } = parseCsvString('id,nombre,precio\n1,Camiseta,49.90\n')
    expect(delimiter).toBe(',')
    expect(headers).toEqual(['id', 'nombre', 'precio'])
    expect(rows[0]).toEqual({ id: '1', nombre: 'Camiseta', precio: '49.90' })
  })

  it('parsea el CSV de Excel es-PE: BOM + ";" + CRLF + comas dentro del texto', () => {
    const text =
      '﻿id;nombre;sku;precio;stock\r\n' +
      '379135;1:18 FERRARI FXX K, SERIE ROJO;18-16907A;410;0\r\n' +
      '404279;1:64 MUSCLE MACHINES;15526-31;29.9;4\r\n'

    const { headers, rows, delimiter } = parseCsvString(text)

    expect(delimiter).toBe(';')
    expect(headers).toEqual(['id', 'nombre', 'sku', 'precio', 'stock'])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      id: '379135',
      nombre: '1:18 FERRARI FXX K, SERIE ROJO',
      sku: '18-16907A',
      precio: '410',
      stock: '0',
    })
    expect(rows[1].precio).toBe('29.9')
  })

  it('respeta las comillas al separar campos', () => {
    const { rows } = parseCsvString('sku,nombre\nA-1,"Camiseta, blanca"\n')
    expect(rows[0].nombre).toBe('Camiseta, blanca')
  })
})

describe('parseCsvNumber', () => {
  it('deja el punto decimal cuando el separador es coma', () => {
    expect(parseCsvNumber('29.9', ',')).toBe(29.9)
  })

  it('trata la coma como decimal cuando el separador es ";"', () => {
    expect(parseCsvNumber('29,9', ';')).toBe(29.9)
  })

  it('quita el separador de miles en formato es-PE', () => {
    expect(parseCsvNumber('1.234,56', ';')).toBe(1234.56)
  })

  it('acepta punto decimal aunque el separador sea ";"', () => {
    expect(parseCsvNumber('29.9', ';')).toBe(29.9)
  })

  it('devuelve NaN con texto', () => {
    expect(parseCsvNumber('abc', ';')).toBeNaN()
  })
})
