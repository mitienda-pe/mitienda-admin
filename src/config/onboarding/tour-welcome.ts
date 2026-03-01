import type { DriveStep } from 'driver.js'

export const welcomeTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Bienvenido a MiTienda',
      description: `
        <div style="line-height:1.6">
          <p>Te guiaremos paso a paso para configurar tu tienda online.</p>
          <p style="margin-top:8px">Para empezar a vender necesitas:</p>
          <ul style="margin-top:6px;padding-left:20px">
            <li><strong>Productos</strong> — lo que vas a vender</li>
            <li><strong>Formas de pago</strong> — como te van a pagar</li>
            <li><strong>Tarifas de envio</strong> — cuanto cuesta el envio</li>
          </ul>
          <p style="margin-top:10px;font-size:12px;color:#9ca3af">Este tour dura menos de 2 minutos.</p>
        </div>
      `,
      popoverClass: 'onboarding-popover onboarding-welcome',
    },
  },
]
