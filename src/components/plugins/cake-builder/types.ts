/** Snapshot de la vista previa guardado en la orden (`plugin_data.values.snapshot.render`). */
export interface CakeRender {
  stackAspect?: number
  layers?: { url: string; z: number }[]
  photo?: {
    url: string
    z: number
    left: number
    top: number
    width: number
    faceTop?: number
    faceLeft?: number
    aspect: number
    rotateX: number
    perspective: number
    round: boolean
  } | null
}
