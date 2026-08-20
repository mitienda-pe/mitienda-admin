# Changelog

Generado con `scripts/changelog.sh` desde los conventional commits.
No editar a mano: los cambios se pierden en la siguiente regeneracion.

## [v2.70.0] - 2026-08-20

### Novedades

- **pasarelas:** mostrar la URL del webhook en el formulario de cada pasarela ([`5417fd2`](https://github.com/mitienda-pe/mitienda-admin/commit/5417fd2122a1949784ec15bf1fcf2b54eb23a342))

## [v2.69.0] - 2026-08-19

### Novedades

- **reportes:** agregar la vista del reporte SIRE ([`a0cdd63`](https://github.com/mitienda-pe/mitienda-admin/commit/a0cdd63ba77f9ec75b95916c04b45193ec1cbc2e))

## [v2.68.0] - 2026-08-19

### Novedades

- **apariencia:** configurar los productos recomendados de la ficha ([`4c3b53c`](https://github.com/mitienda-pe/mitienda-admin/commit/4c3b53cc8d0446b56f1192e4dbb5cd13cfc257b1))
- **apariencia:** separar que se fija de donde va la descripcion ([`ab14217`](https://github.com/mitienda-pe/mitienda-admin/commit/ab14217d72ea60d1c5bf8ee94fd67038744cb3f1))

## [v2.66.0] - 2026-08-19

### Novedades

- **apariencia:** selector de galeria de la ficha de producto ([`af0156a`](https://github.com/mitienda-pe/mitienda-admin/commit/af0156afa227b8e99ab3801c10420423e8bd9691))
- **apariencia:** selector de disposicion de la ficha de producto ([`4591526`](https://github.com/mitienda-pe/mitienda-admin/commit/4591526dbed7f7deacd18f93cac0d9adeddd7e46))
- **openpay:** interruptor de 3D Secure en la ficha de la pasarela ([`b79bee6`](https://github.com/mitienda-pe/mitienda-admin/commit/b79bee6749a8ab1a5810ac73e12d38f11f60428a))
- **reportes:** selector de modo y columna SKU en ventas por producto ([`6a20ef9`](https://github.com/mitienda-pe/mitienda-admin/commit/6a20ef91e7fac3536ed5b0dc5ff31b34d3deefbb))
- **inventario:** "Stock por almacén" en el menú y vocabulario unificado ([`452f308`](https://github.com/mitienda-pe/mitienda-admin/commit/452f30859c73f64949270db58bd72df4553357f0))
- **inventario:** elegir variante al mover stock y transferir ([`7c9399d`](https://github.com/mitienda-pe/mitienda-admin/commit/7c9399d00494a92c7c5dd0b9faad95a97f1d9b27))
- **inventario:** kardex, movimientos manuales y transferencias en el backoffice ([`b372085`](https://github.com/mitienda-pe/mitienda-admin/commit/b372085974ed64312ded3fa633036baad19a7a91))
- **usuarios:** rol Administrador en la gestión de usuarios ([`4deef86`](https://github.com/mitienda-pe/mitienda-admin/commit/4deef865722b03b974d4ecc57ea230b83c492e3c))
- **despacho:** ordenar el listado por fecha de pago ([`b87d291`](https://github.com/mitienda-pe/mitienda-admin/commit/b87d29126fcf8cf4c1ddd97c92715aacbf42b19d))
- **productos:** cantidad maxima de compra por producto ([`4f413f7`](https://github.com/mitienda-pe/mitienda-admin/commit/4f413f7d9ff0e097d00dac8a5141461fed9864b3))
- **pedidos:** columna Sync en el listado de ordenes ([`154b805`](https://github.com/mitienda-pe/mitienda-admin/commit/154b80507b2bccb9ceaa4242b8165a75d7e2f5d1))
- **pedidos:** estado de las integraciones en el detalle y en el historial ([`834a9ed`](https://github.com/mitienda-pe/mitienda-admin/commit/834a9ed125ef00abdefab6ce145d3279b683da79))
- **usuarios:** esconder del menú los módulos sin permiso ([`a449a24`](https://github.com/mitienda-pe/mitienda-admin/commit/a449a243fd90db756d7b4ad86da8432da3e98c1d))
- **ar:** boton para insertar el shortcode del visor 3D/AR ([`5f82dfa`](https://github.com/mitienda-pe/mitienda-admin/commit/5f82dfaa05b75ba777747c35db13fe75308bd60a))
- **admin:** buscar tiendas por id y mostrarlo en la tarjeta ([`fb71295`](https://github.com/mitienda-pe/mitienda-admin/commit/fb7129580856f6a19468b894b9fc49d3de0eda90))
- **config:** selector del mapa de ubicacion en el checkout ([`00c00b9`](https://github.com/mitienda-pe/mitienda-admin/commit/00c00b9693111300be65b5342c7293618095e06c))
- **contenido:** columna de uso y borrado de bloques sin usar ([`7384c9b`](https://github.com/mitienda-pe/mitienda-admin/commit/7384c9b6c0cfd1c0d10a1b974c3f0e3609f5ae6e))
- **netsuite:** campo Motivo de Venta en las credenciales ERP ([`61b6d99`](https://github.com/mitienda-pe/mitienda-admin/commit/61b6d99220f0052c101003678918ae2086e20d4f))

### Correcciones

- **plugins:** el menú Plugins desaparecía al cambiar de tienda y por permisos ([`628b7fd`](https://github.com/mitienda-pe/mitienda-admin/commit/628b7fdcd4044ec1e6e0122198a2b77056dd9172))
- **pedidos:** dar identidad propia al estado "Sin pago iniciado" (9) ([`e99b968`](https://github.com/mitienda-pe/mitienda-admin/commit/e99b9682bbedb9f9cf1dbf360de8a3d82ebfc65c))
- **pedidos:** mostrar el estado 5 legacy como contracargo (v2.65.5) ([`214e672`](https://github.com/mitienda-pe/mitienda-admin/commit/214e672e1568bf802d19f64acd49143beb0044aa))
- **pedidos:** filtrar y etiquetar expirados, contracargos y reembolsos ([`39bd17c`](https://github.com/mitienda-pe/mitienda-admin/commit/39bd17c4b75c73a8c6065b7b88d9d495a9f98d43))
- **culqi:** usar las llaves de métodos de pago que exige Checkout v4 ([`1b1bf05`](https://github.com/mitienda-pe/mitienda-admin/commit/1b1bf05b32becdcf62bff5bd211ec8348337c087))
- **productos:** la cantidad maxima de compra no se guardaba ([`87ab3f1`](https://github.com/mitienda-pe/mitienda-admin/commit/87ab3f16b0285f600082c2121b2cb2c7f83b93e7))
- **reportes:** tipar nombres y apellidos separados en ventas por producto ([`d7f861e`](https://github.com/mitienda-pe/mitienda-admin/commit/d7f861e3305f0dbba61c3e67a7df71331e4bd142))
- **inventario:** el selector de almacén de "Stock por almacén" estaba siempre vacío ([`8ef636c`](https://github.com/mitienda-pe/mitienda-admin/commit/8ef636cdf4284aaa3effda7357de57695b528184))
- **inventario:** copy de almacenes acorde a lo que el comerciante ve ([`fa8206d`](https://github.com/mitienda-pe/mitienda-admin/commit/fa8206df0a7350b3a6a0892822caa3be380b3d03))
- **clientes:** el detalle decia "Cliente no encontrado" mientras cargaba ([`00f6c53`](https://github.com/mitienda-pe/mitienda-admin/commit/00f6c539c4b0681d86a016cbb0e16efa854053e0))
- **usuarios:** refrescar los permisos al impersonar y al salir ([`868328b`](https://github.com/mitienda-pe/mitienda-admin/commit/868328be3b345b65c5e07c6afda1ba673b024ad8))
- **carrusel:** no declarar aspecto movil al crear un slide ([`edbe502`](https://github.com/mitienda-pe/mitienda-admin/commit/edbe5021954bb952248852dd88bcb7ba34d4d86a))
- **pedidos:** no mostrar el card de NetSuite en tiendas que no lo usan ([`67947d0`](https://github.com/mitienda-pe/mitienda-admin/commit/67947d0946e7f8abf7cbb0ad0e0a4a46d1e28e4e))
- **usuarios:** avisar en vez de fallar cuando no eres el dueño ([`09f5090`](https://github.com/mitienda-pe/mitienda-admin/commit/09f50901ec50b24688d0eac49d83908becfd2945))
- **usuarios:** no repetir encabezados en la pantalla de permisos ([`daea66a`](https://github.com/mitienda-pe/mitienda-admin/commit/daea66a996148db40c5615deb62331b01f7fe501))
- **pedidos:** mostrar el último envío y frenar el reenvío repetido al vendedor ([`efa961f`](https://github.com/mitienda-pe/mitienda-admin/commit/efa961f69d6d73dabbee3310756cb80e288af828))
- **productos:** mostrar el precio de lista y la promo en el listado ([`109e868`](https://github.com/mitienda-pe/mitienda-admin/commit/109e8681f2d968aee2d19aa22019f72432b4e8ea))
- **contenido:** "Solo lectura" no explicaba nada en los bloques legacy ([`770587c`](https://github.com/mitienda-pe/mitienda-admin/commit/770587ce834ccbfb64b100c224cee019183d7dc8))
- **pedidos:** distinguir eventos del historial que caen en el mismo minuto ([`030961a`](https://github.com/mitienda-pe/mitienda-admin/commit/030961afad512c10220ef0999902cc4729b842dd))
- **pedidos:** mostrar la hora real del pago en el historial del pedido ([`983721e`](https://github.com/mitienda-pe/mitienda-admin/commit/983721e9dea760dbd3650d2b09319ca0243325f6))

## [v2.59.0] - 2026-08-11

### Novedades

- **pedidos:** boton para consultar el estado del pago en la pasarela ([`6efb3e7`](https://github.com/mitienda-pe/mitienda-admin/commit/6efb3e761e5b2739aadb9b2d1c2ba833a844df0d))
- **cupones:** toggle "Acumulable" y tope de descuento en cupones (v2.58.0) ([`fa4b818`](https://github.com/mitienda-pe/mitienda-admin/commit/fa4b818af7ca585d6cd15d7ab6cc8594fa281fb5))
- **configuracion:** opción para exigir documento validado en el checkout ([`38af813`](https://github.com/mitienda-pe/mitienda-admin/commit/38af8138c2590dcba89fe050f85cd233dddbe1ca))
- **precios-por-mayor:** export/import CSV masivo desde la vista de Precios ([`13f899b`](https://github.com/mitienda-pe/mitienda-admin/commit/13f899ba9595d80bec094d957ba37c54040d5a65))
- **precios-por-mayor:** editor de tramos en la ficha de producto ([`dd22b02`](https://github.com/mitienda-pe/mitienda-admin/commit/dd22b02d62bacb7a4e95fd350bb1e50c944ffa98))

### Correcciones

- **catalogos:** mostrar el error real del API y avisar del tope de 100 ([`a44ccac`](https://github.com/mitienda-pe/mitienda-admin/commit/a44ccacf5f9938b9f2671ba089300946839c6c4d))
- **moneda:** mostrar los montos en la moneda de venta, no en la del pais ([`6de1b63`](https://github.com/mitienda-pe/mitienda-admin/commit/6de1b63571e9f4268e7944177f9ddac742be9e14))

## [v2.57.1] - 2026-08-06

### Correcciones

- **productos:** quitar el filtro de publicacion del modulo Orden ([`f0106f2`](https://github.com/mitienda-pe/mitienda-admin/commit/f0106f25ef6a0335f0df14dd54a78ef7267239d9))

## [v2.57.0] - 2026-08-06

### Novedades

- **productos:** filtro por estado de publicacion en precios, stock y orden ([`a2ebab9`](https://github.com/mitienda-pe/mitienda-admin/commit/a2ebab9dc446f2b0ca00175d733d7b993ad5e896))
- **despacho:** picking y etiqueta desde Despacho, con documento e indicaciones ([`e582563`](https://github.com/mitienda-pe/mitienda-admin/commit/e5825638a1021b3eb987fb2075a7c61f6ccdc675))
- **cabify:** elegir el tipo de envio desde los disponibles en la cuenta ([`ac2cccc`](https://github.com/mitienda-pe/mitienda-admin/commit/ac2cccc97d8d94b639adefe00c8a4ea33c4c996e))
- **facebook:** campo de verificacion de dominio de Meta ([`ee93046`](https://github.com/mitienda-pe/mitienda-admin/commit/ee930463949513c010b4f77e46872b8d8a5b0faa))

### Correcciones

- **ui:** quitar los ConfirmDialog duplicados que abrian el modal dos veces ([`410e752`](https://github.com/mitienda-pe/mitienda-admin/commit/410e7528d487306773c06b3465bf8abe15ebc754))
- **integraciones:** no exigir el grant token al editar un proveedor configurado ([`54deca4`](https://github.com/mitienda-pe/mitienda-admin/commit/54deca4940dfa2209bbb769a90dfa45cba2842c9))

## [v2.55.1] - 2026-08-04

### Correcciones

- **bulk-import:** detectar el separador del CSV (Excel es-PE guarda con ";") ([`657aa1c`](https://github.com/mitienda-pe/mitienda-admin/commit/657aa1ce4352e7f32ae7d499a91d4e3d7802aa0f))

## [v2.55.0] - 2026-08-04

### Novedades

- **tiendas:** verificar el correo por OTP al crear una tienda nueva ([`e38aee9`](https://github.com/mitienda-pe/mitienda-admin/commit/e38aee9bce62c917c636e78c78ff02b95d3a3611))

## [v2.54.0] - 2026-08-04

### Novedades

- **plantilla:** elegir el modo del home y ver como queda antes de guardar ([`cb06f36`](https://github.com/mitienda-pe/mitienda-admin/commit/cb06f361a207ae025b2b2b29d5dc013bb56d0a59))

## [v2.53.0] - 2026-08-04

### Novedades

- **plantilla:** separar productos por lista de cantidad de listas ([`9d45828`](https://github.com/mitienda-pe/mitienda-admin/commit/9d45828f467fde3de3bff5790b6ec08cad936c69))
- **clientes:** restaurar la busqueda por correo en el panel ([`bd24dc9`](https://github.com/mitienda-pe/mitienda-admin/commit/bd24dc98fec1039a4054f111e135deb2161c9236))
- **icbper:** marcar productos como bolsa plastica afecta (Ley 30884) ([`6c36f36`](https://github.com/mitienda-pe/mitienda-admin/commit/6c36f360f74ba3ed207331f652fcc85ea3593180))
- **billing:** enviar comprobantes manuales por email ([`a5c96d9`](https://github.com/mitienda-pe/mitienda-admin/commit/a5c96d99b889e04ffae33b8a11ff81baad0ba3ca))
- **busqueda:** anunciar la busqueda por telefono en Ventas y Clientes ([`7db27a9`](https://github.com/mitienda-pe/mitienda-admin/commit/7db27a913aeca003c6fdd4041089be9bddcf0a5e))
- **reports:** vista de reportes personalizados por tienda ([`8c8a26d`](https://github.com/mitienda-pe/mitienda-admin/commit/8c8a26d605011cdc5309ac9cc706159c7ce3e7e8))
- **orders:** mostrar sucursal de recojo en el detalle de orden ([`48449bb`](https://github.com/mitienda-pe/mitienda-admin/commit/48449bbbbfc2292b0877ff3e6a759b1b42ad09c3))
- **orders:** indicar "Recojo en tienda" en el detalle de orden ([`b837737`](https://github.com/mitienda-pe/mitienda-admin/commit/b837737fe2c3ab7d7e5f933118877116d04e1b7c))
- **orders:** editar observaciones de tienda y etiquetar el nro de operacion ([`4cdc9ea`](https://github.com/mitienda-pe/mitienda-admin/commit/4cdc9ea042776444e5069f49b651c9d3588ceb75))
- **orders:** mostrar tarifa de envio y envio gratis en detalle y despacho ([`271e785`](https://github.com/mitienda-pe/mitienda-admin/commit/271e78569964d5d2c742c35cb85e98b203dbe55c))
- **billing:** configurar series de notas de credito en Nubefact ([`6c41eae`](https://github.com/mitienda-pe/mitienda-admin/commit/6c41eae81307516e0cd06461856b03eeaa3c846a))
- **netsuite:** campo Ítem de envío/Delivery en config credenciales ([`11b38ae`](https://github.com/mitienda-pe/mitienda-admin/commit/11b38ae8261e65e93ef6644cffd0db8744448c7b))
- **products:** toggle "Publicado en POS" (producto_publicado_pos) ([`5f8e9f8`](https://github.com/mitienda-pe/mitienda-admin/commit/5f8e9f88e9ac443946911b1e7fe8820282261038))
- **billing:** ver comprobantes manuales en el listado de Documentos ([`b8e87d6`](https://github.com/mitienda-pe/mitienda-admin/commit/b8e87d68238345ed8d811c3de3d9987d17a86752))
- **pages:** diálogo de shortcodes con campos múltiples y pickers de recursos ([`fc2af08`](https://github.com/mitienda-pe/mitienda-admin/commit/fc2af08d354d3e9b3fae815e6737054e3fe6ee3f))
- **facturacion:** Carné de Extranjería y Pasaporte en emisión manual ([`d8c6a9b`](https://github.com/mitienda-pe/mitienda-admin/commit/d8c6a9b33bd6c21ef93658f9b3ba8b6b9f110baf))
- **facebook:** toggle Activar/Pausar en la vista de Facebook (v2.51.1) ([`96e1675`](https://github.com/mitienda-pe/mitienda-admin/commit/96e16759036dd97358e83362798d75591827f4f2))
- **payment-gateways:** mostrar logo de Tilopay en la lista de pasarelas ([`0ae0b4f`](https://github.com/mitienda-pe/mitienda-admin/commit/0ae0b4f0cb374d4661a5c4bd7d0da985a72b66b6))
- **catalogs:** vista generador de catálogos PDF ([`5494141`](https://github.com/mitienda-pe/mitienda-admin/commit/54941412d22c774b139059f044941fbf215d3e61))
- **products:** importar CSV en Orden del Catálogo ([`d31899a`](https://github.com/mitienda-pe/mitienda-admin/commit/d31899a5dcdb4bcad7c2068ea5593adcd6c0b5ea))
- **products:** elegir afectación IGV en bulk-import y edición de precios ([`f889df6`](https://github.com/mitienda-pe/mitienda-admin/commit/f889df6d7dd4c7e17419d2d6411fb764e3bfe5ec))
- **admin:** agregar plan POS al filtro de planes en admin/stores ([`4093b83`](https://github.com/mitienda-pe/mitienda-admin/commit/4093b83f37f1c1763d02b56d23ad1273111c7bad))
- **billing:** enlace "Series por sucursal" en menú de Facturación (v2.48.1) ([`b0b7cc3`](https://github.com/mitienda-pe/mitienda-admin/commit/b0b7cc3cfb02a88fe3913fbd3fedee2bd93a881c))
- **billing:** UI de series de facturación por sucursal (v2.48.0) ([`57d79a8`](https://github.com/mitienda-pe/mitienda-admin/commit/57d79a872eb91ffc21b78dec2109f78571b78592))
- **store-config:** toggle "Solo emito Boleta de Venta" ([`b1d1a35`](https://github.com/mitienda-pe/mitienda-admin/commit/b1d1a35185c1dc9ec156f2f9df5275efa9de1eb8))
- **plugins:** config UI del add-on Rutinas de Cuidado (care-routines) ([`3a5ed86`](https://github.com/mitienda-pe/mitienda-admin/commit/3a5ed867b7940e084eed6963fc18c36fe76cf035))
- **dispatch:** despacho manual de Home Delivery en el panel ([`75e0dde`](https://github.com/mitienda-pe/mitienda-admin/commit/75e0dde70ecadb079d61a377acbf408a915f1a4c))
- **shipping:** tarifa por provincia con distritos excluidos ([`7497289`](https://github.com/mitienda-pe/mitienda-admin/commit/749728922d52fdd82d5da85ee7f879d46b4767c6))
- **dispatch:** despacho manual de Cabify en el panel de despacho ([`749b2c5`](https://github.com/mitienda-pe/mitienda-admin/commit/749b2c504cad8789175b618635a04ae9d669eda9))
- **couriers:** logos de Cabify y Home Delivery en lista y config ([`f388a48`](https://github.com/mitienda-pe/mitienda-admin/commit/f388a48d8bb54758173ec16bc372c28acc871c33))
- **web-analytics:** card de tráfico por campaña UTM (v2.45.0) ([`466c4d7`](https://github.com/mitienda-pe/mitienda-admin/commit/466c4d7fe8b744fddef45e4c7240bc55c7e323fc))
- **couriers:** vistas de configuración Cabify y Home Delivery ([`84d0af4`](https://github.com/mitienda-pe/mitienda-admin/commit/84d0af4643ad60d39abcb89bcef7f20d3f448791))
- **payment-gateways:** configuración de Ligo QR (v2.43.0) ([`fa68573`](https://github.com/mitienda-pe/mitienda-admin/commit/fa685737f4be095379396fa20eb531d025054e0a))
- **promotions-v2:** efecto "descuento fijo por producto" ([`8043c2f`](https://github.com/mitienda-pe/mitienda-admin/commit/8043c2f626d42c3380c696308364318316fd541a))
- **billing:** botón de exportación Excel (xlsx) en documentos ([`f5ddc43`](https://github.com/mitienda-pe/mitienda-admin/commit/f5ddc434b8ef0ba1b4ce5c39d2687890a31b0aef))
- **products:** soporte de tipo producto/servicio en el backoffice ([`d565893`](https://github.com/mitienda-pe/mitienda-admin/commit/d5658939c30355b74f7847d5881aaedc335c7b28))
- **billing:** botón de recuperación PDF/XML para comprobantes legacy (FacturaenUna) ([`7d32e79`](https://github.com/mitienda-pe/mitienda-admin/commit/7d32e7927b108a54f754049e20a4cfdcb2dc9f2d))
- **billing:** filtros, buscador, export CSV y columnas serie/correlativo/CDR ([`580dd62`](https://github.com/mitienda-pe/mitienda-admin/commit/580dd620b3e159031a4d58fa4e917ab61bcf8712))
- **netsuite:** modo de sincronización por canal (web/pos) en config ([`badb740`](https://github.com/mitienda-pe/mitienda-admin/commit/badb7408af928225c8778899f9440b925a4a5445))
- **netsuite:** permitir agregar series manualmente en el mapeo ([`bc230ea`](https://github.com/mitienda-pe/mitienda-admin/commit/bc230ead1380eb1693f713e90e1a13b8bcc4ed42))
- **netsuite:** Consultar pagos muestra SO + prepago en modo sales_order ([`8b5c272`](https://github.com/mitienda-pe/mitienda-admin/commit/8b5c27249c8f6b08a52efae2b1a8f4e6f5256247))
- **netsuite:** sección 'Por pasarela' en la pestaña Cuentas ([`4186040`](https://github.com/mitienda-pe/mitienda-admin/commit/418604093a6fdd08391435bfb59bb19d87918cee))
- **netsuite:** pestaña de cuentas bancarias/caja en config del backoffice ([`bb64941`](https://github.com/mitienda-pe/mitienda-admin/commit/bb64941d03c7601efd518ff8d8c5fac83a2eec23))
- **plugins:** ocultar menú Plugins salvo tiendas con plugins activos ([`ef977ac`](https://github.com/mitienda-pe/mitienda-admin/commit/ef977aca12b72abcca769a5643b90b104753cbb2))
- **images:** subida de imágenes en la galería (individual + ZIP por lote) ([`7fb0718`](https://github.com/mitienda-pe/mitienda-admin/commit/7fb07183ba3df5f562c2eb410e8046f4f58e193b))
- **netsuite:** override de serie por sucursal como select que hereda ([`2e649ae`](https://github.com/mitienda-pe/mitienda-admin/commit/2e649ae40a4424d3db8bb059f65e744258c5c872))
- **netsuite:** configurar Modo de sync y Custom Form del Sales Order ([`3a0dba1`](https://github.com/mitienda-pe/mitienda-admin/commit/3a0dba14d3b5ae2377e35a8857c96644d6ce143c))
- **envios:** UI de sucursal despachadora por zona (omnicanal) ([`28c90fc`](https://github.com/mitienda-pe/mitienda-admin/commit/28c90fcdefa712c4d0bf78dfba8b02c95a93d5d1))
- **pages:** barra de URL del preview con dominio completo y enlace clickeable ([`c1e2b4f`](https://github.com/mitienda-pe/mitienda-admin/commit/c1e2b4fde06586022fe68c6a01252c094a15cb03))
- **ai:** enviar max_tokens=8000 al generar HTML (evita truncado) ([`fb2536f`](https://github.com/mitienda-pe/mitienda-admin/commit/fb2536f7ba33814d77b6601eea7be6dce8ccdd40))
- **pages:** asistente de HTML con IA para páginas y bloques ([`068f099`](https://github.com/mitienda-pe/mitienda-admin/commit/068f099ae727e596a610504cb798bbb3e3e8e022))
- **promociones:** condición "comprador registrado" en Promociones V2 ([`cc24938`](https://github.com/mitienda-pe/mitienda-admin/commit/cc24938f67b5b2cdaf7e7c6b4f88656080a8decc))
- **products:** toggle "Vender al peso" en el formulario de producto ([`1cd0a1e`](https://github.com/mitienda-pe/mitienda-admin/commit/1cd0a1e99a8084ee3829a3db8dc779bd95f80ad4))

### Correcciones

- **carritos:** avisar cuando falla la exportacion ([`8a7ed05`](https://github.com/mitienda-pe/mitienda-admin/commit/8a7ed05ae420c9bf1c2f5f02a57c239748fb65f2))
- **billing:** el listado recargaba con filtros invisibles ([`cab013b`](https://github.com/mitienda-pe/mitienda-admin/commit/cab013b6fc4cb39341eedd34280ee288751a9fd0))
- **reports:** refrescar visibilidad de reportes personalizados al cambiar de tienda ([`9cbc237`](https://github.com/mitienda-pe/mitienda-admin/commit/9cbc237b2965206d5aa0db53ddeaa96626176bb3))
- **clientes:** no ocultar por defecto a los clientes sin compras ([`bb908b1`](https://github.com/mitienda-pe/mitienda-admin/commit/bb908b1b74085d49cbf9c1bca8f21fae5322dd74))
- **orders:** distinguir suscripciones activas de suscritas a order.paid ([`972aa26`](https://github.com/mitienda-pe/mitienda-admin/commit/972aa268f133c41051718dae72fa15c0bac6b463))
- **billing:** mostrar el error real al fallar la emisión manual ([`611d459`](https://github.com/mitienda-pe/mitienda-admin/commit/611d459ee965125163bf33f8121c3cc4cf22cfb5))
- **pages:** permitir que el usuario anule la paleta de marca en el asistente IA ([`ea247f0`](https://github.com/mitienda-pe/mitienda-admin/commit/ea247f08e66f7f4b013ccaad1548fc6ea1c22ab9))
- **pages:** builder pierde último cambio y HTML de IA se guarda corrupto ([`d4000e9`](https://github.com/mitienda-pe/mitienda-admin/commit/d4000e97d0f41ded746a5494c9c6d57afa6e5631))
- **billing:** usar afectación real del producto al agregar desde catálogo ([`77f919b`](https://github.com/mitienda-pe/mitienda-admin/commit/77f919b49a2d2862aa68cc55febc0d4a9e7cdbda))
- **billing:** respetar afectación exonerado/inafecto en tabla de items manual ([`44af8c6`](https://github.com/mitienda-pe/mitienda-admin/commit/44af8c636b12e062afaed0b4d19fec9ad1e73b10))
- **payment-gateways:** formulario de configuración de Tilopay ([`691ecce`](https://github.com/mitienda-pe/mitienda-admin/commit/691ecceb84dcec90b4a08d2ed336dac78cf3d515))
- **variantes:** mostrar imagen de variante usando image_url resuelto (v2.50.1) ([`22595d6`](https://github.com/mitienda-pe/mitienda-admin/commit/22595d61f94b5503b6fed2d0041e6c98ac740433))
- **sanitize:** permitir iframes de video en previews del backoffice (v2.49.3) ([`78dea34`](https://github.com/mitienda-pe/mitienda-admin/commit/78dea341e6bc52e3effc78672ccc3602ceb11e9c))
- **preview:** mostrar embeds de video en previews del backoffice (v2.49.2) ([`b5f2631`](https://github.com/mitienda-pe/mitienda-admin/commit/b5f2631043cf1068cb8c2e5a6979ef5c24fbec88))
- **editor:** conservar embed code de YouTube/Vimeo pegado en Quill (v2.49.1) ([`89d7f6f`](https://github.com/mitienda-pe/mitienda-admin/commit/89d7f6f93178eb17b60beb9fd7f1eea9f35688d8))
- **billing:** nombre de sucursal en tabla y preselección en editar serie (v2.48.2) ([`0114eed`](https://github.com/mitienda-pe/mitienda-admin/commit/0114eed1ebec836516682b1ac3cb80885dc7a67b))
- **shipping:** dropdown de zona vacío en reglas de courier ([`e4b7e73`](https://github.com/mitienda-pe/mitienda-admin/commit/e4b7e736a3aab058e4e627526da1501a792fba93))
- **shipping:** tarifas de departamento/provincia visibles en su nivel real ([`a3e65a4`](https://github.com/mitienda-pe/mitienda-admin/commit/a3e65a45fa0ca7949c2994851de8128247f80819))
- **billing:** mostrar mensaje limpio del 409 + badge "Pendiente SUNAT" ([`f78657a`](https://github.com/mitienda-pe/mitienda-admin/commit/f78657ae3e8220dd6784d65eea887b24453b3869))
- **orders:** mostrar DNI del destinatario en detalle de orden ([`b375647`](https://github.com/mitienda-pe/mitienda-admin/commit/b3756474fcde79913145c87de0e92f481f888ada))
- **netsuite:** dropdown de pasarela no mostraba selección (id string vs number) ([`22ea052`](https://github.com/mitienda-pe/mitienda-admin/commit/22ea05241125332eea7cc5fdc71fcff8acc04fec))
- **netsuite:** elimina tags residuales que rompían el build de la pestaña Cuentas ([`457d3ea`](https://github.com/mitienda-pe/mitienda-admin/commit/457d3ea7c6aa79cb43501332082e8e15ea0d0170))
- **integrations:** agrupar Niux y Contanet bajo categoría ERP ([`ca7c53e`](https://github.com/mitienda-pe/mitienda-admin/commit/ca7c53e669a280175ddef11d070939e62b46a1cf))
- **shipping:** el "+" de una fila abre el diálogo cascada con el padre preseleccionado ([`d2eaf55`](https://github.com/mitienda-pe/mitienda-admin/commit/d2eaf55f9f2733d28ab6119bf29b8075c2b728a8))
- **netsuite:** claridad en overrides por sucursal (no parece dato perdido) ([`5bac310`](https://github.com/mitienda-pe/mitienda-admin/commit/5bac310d4f99680fbac0f2d374b40dcc35172161))
- **atributos:** mensaje claro al no poder eliminar una opción en uso ([`96c6a5c`](https://github.com/mitienda-pe/mitienda-admin/commit/96c6a5c23e7e500ebaf9686c4fa13b0fcdd610c3))
- **shipping:** permitir tarifas de envío en 0 (envío gratis) ([`176499b`](https://github.com/mitienda-pe/mitienda-admin/commit/176499b792c3b7a5e364e20165e92049e94efe24))
- **pages:** mostrar la URL real /pagina/{slug} en preview, editor y lista ([`d428a5e`](https://github.com/mitienda-pe/mitienda-admin/commit/d428a5e9bdfd129d7f719332d19ead0b93796ae4))
- **ai:** tipografías robustas en el prompt + temperatura 0.2 ([`8040aa2`](https://github.com/mitienda-pe/mitienda-admin/commit/8040aa28b34360564699b9f73cd35a1e2d0bc602))
- **ai:** guardar al aplicar el HTML generado (evita perderlo en vista previa) ([`232240a`](https://github.com/mitienda-pe/mitienda-admin/commit/232240a6fefdf7e5f7212b664880026ac3915ec4))
- **inventario:** enviar lots_managed en updateProduct (toggle no grababa) ([`06fe113`](https://github.com/mitienda-pe/mitienda-admin/commit/06fe11310bd84ff0a89c43909e89d2f960c82274))
- **products:** persistir y leer "Vender al peso" (sold_by_weight) ([`d42784f`](https://github.com/mitienda-pe/mitienda-admin/commit/d42784f5eb914077ef213777ef0a8989b2701d76))
- **productos:** preservar has_variation_attributes en normalización de getProduct ([`0ea9ceb`](https://github.com/mitienda-pe/mitienda-admin/commit/0ea9ceb94d0c9fc902e8de0f3fdaacd160c73250))
- **productos:** ocultar precio/costo general en ficha cuando hay variaciones ([`6ccee76`](https://github.com/mitienda-pe/mitienda-admin/commit/6ccee76c327a5d06b10f6e184c2fe4760498faf5))
- **productos:** ocultar stock general en ficha cuando hay variaciones ([`bf8c499`](https://github.com/mitienda-pe/mitienda-admin/commit/bf8c49946e6f257564aed606172927498602091d))
- **billing:** ocultar selector de formato PDF en config Bizlinks ([`a1331c0`](https://github.com/mitienda-pe/mitienda-admin/commit/a1331c01fd48001edb5910455f2258ec190744f4))
- **productos:** botones del cropper y barra superior envuelven en móvil ([`8483107`](https://github.com/mitienda-pe/mitienda-admin/commit/8483107f21f2df440f8a270efa0e3bcfb8e3a364))
- **productos:** modal de imagen responsivo y no arrastrable en móvil ([`05f3f1a`](https://github.com/mitienda-pe/mitienda-admin/commit/05f3f1ad586396c9740dee5a668c70af78fcf3f7))
- **menu:** permitir editar tipo y valor de un enlace, no solo la etiqueta ([`9313b9b`](https://github.com/mitienda-pe/mitienda-admin/commit/9313b9b71a13c6fd85b032fe88c77bbda286ff5d))

### Refactor

- **products:** renombrar "Publicado" a "Publicado en Web" ([`26acb00`](https://github.com/mitienda-pe/mitienda-admin/commit/26acb00b812a0e1078b81d62a63b8e686333efe2))

## [v2.40.1] - 2026-06-23

### Correcciones

- **backoffice:** aclarar texto de título vacío para bloque listas ([`a2c9581`](https://github.com/mitienda-pe/mitienda-admin/commit/a2c9581f9f0fa8aae2cb5c685eb701ccda3c6b7c))

## [v2.40.0] - 2026-06-23

### Novedades

- **backoffice:** layouts de columnas asimétricas en el builder de plantillas ([`cc9b267`](https://github.com/mitienda-pe/mitienda-admin/commit/cc9b267bb698f853c57c7a42f969a32d6db523af))
- **billing:** opción "Facturación incluida en el plan" en config Bizlinks ([`1ec75be`](https://github.com/mitienda-pe/mitienda-admin/commit/1ec75be3795efb194dd2aa8b7babe649d8f6c0bd))
- **appearance:** subir logotipo para móvil ([`79f40c6`](https://github.com/mitienda-pe/mitienda-admin/commit/79f40c6f93b72bce7ee9689639118ec8ea6362a3))
- **pages:** botón "Insertar shortcode" en el editor de páginas ([`ba088a6`](https://github.com/mitienda-pe/mitienda-admin/commit/ba088a625b737f4a425e510fbd8d238df4ca8b3c))
- **billing:** mostrar y validar el tipo de comprobante solicitado ([`41091a6`](https://github.com/mitienda-pe/mitienda-admin/commit/41091a620f4ea47d7789bae111292d574f96920e))
- **billing:** opcion REST nativo (PSE) en config de Bizlinks ([`bc69e60`](https://github.com/mitienda-pe/mitienda-admin/commit/bc69e605a93ae0d01617149fb62706dcd14a2aa7))
- **billing:** selector de modo (proxy SOAP / directo REST) en config Bizlinks ([`3acd00a`](https://github.com/mitienda-pe/mitienda-admin/commit/3acd00add1223eece7f6597c43df86cfd1282f0c))
- **referidos:** import/export CSV en el módulo de referidos ([`ad1744e`](https://github.com/mitienda-pe/mitienda-admin/commit/ad1744e2fa3f8708a6952daf2e15dd8b4fafd41b))
- **referidos:** mostrar total de códigos en el encabezado ([`b0d306c`](https://github.com/mitienda-pe/mitienda-admin/commit/b0d306c6363b6bbab049e5daa2915756543a6f1e))
- **inventario:** UI de control por lotes y vencimiento (Fase 2) ([`6ddbd8c`](https://github.com/mitienda-pe/mitienda-admin/commit/6ddbd8c0e2a6c30fd59ec6a1fa1c0a68dc497be5))
- **productos:** capturar costo de compra y mostrar ganancia/margen ([`9e424e8`](https://github.com/mitienda-pe/mitienda-admin/commit/9e424e8280cdab7c05f3c5867caf8f1d65c5f8dd))
- **doppler:** vista de configuración del script de Doppler ([`53bd081`](https://github.com/mitienda-pe/mitienda-admin/commit/53bd08110169fe5dfbdeda8f38d72c9bd87d6664))
- **products:** código de barras por variación ([`e7c2b24`](https://github.com/mitienda-pe/mitienda-admin/commit/e7c2b24ed39a1207802eb69fed51a6cc27c5dd3f))
- **products:** botón de video YouTube/Vimeo en editor Quill ([`9708ed5`](https://github.com/mitienda-pe/mitienda-admin/commit/9708ed594f98fdf3deead0f71cc3e93eba8e9298))
- **niubiz:** mostrar URL del webhook (Callback) en la config de la pasarela ([`f8355b9`](https://github.com/mitienda-pe/mitienda-admin/commit/f8355b923cb205df52388156c33b654894792bbf))
- **billing:** deshabilitar emisión manual en delegada/sin proveedor ([`9b8ef55`](https://github.com/mitienda-pe/mitienda-admin/commit/9b8ef55e549fd169702f1eb604ed7f2284c913f2))
- **carousel:** permitir subir imagen completa sin recortar si ya cumple el aspect ratio ([`c129a07`](https://github.com/mitienda-pe/mitienda-admin/commit/c129a07099b18bd6820dde12accb9bdf4890ec89))
- **sidebar:** unificar API bajo Integraciones + ocultar Webhooks legacy ([`2bee42a`](https://github.com/mitienda-pe/mitienda-admin/commit/2bee42af6520e18faa5a86a8943f301e46a738d4))
- **orders:** panel de notificaciones en detalle de pedido ([`2530c31`](https://github.com/mitienda-pe/mitienda-admin/commit/2530c31b3c6743a5f98f8d36f18de41f4cddbae7))
- **orders:** mostrar dirección de facturación en el detalle de orden ([`07be2d8`](https://github.com/mitienda-pe/mitienda-admin/commit/07be2d8f56ed94616e9e3355c5b6680c123f22dd))

### Correcciones

- **editor:** el botón de video rompía el toolbar de Quill (v2.39.21) ([`d83f449`](https://github.com/mitienda-pe/mitienda-admin/commit/d83f449b8572fe1ea917669f402abae4019d9a3e))
- **billing:** password Bizlinks opcional al editar (modo proxy) ([`5f8f817`](https://github.com/mitienda-pe/mitienda-admin/commit/5f8f8179e78cdb53b914b9437e027e8ac7118f63))
- **envio:** limpiar monto de reparto gratis al apagar el switch ([`f6d6ee8`](https://github.com/mitienda-pe/mitienda-admin/commit/f6d6ee8d676db3aebed420026eece403714ef038))
- **referidos:** arreglar paginación en la lista de códigos ([`738cba6`](https://github.com/mitienda-pe/mitienda-admin/commit/738cba6842b82fe6117adf909c46066c1807665b))
- **referidos:** normalizar estado con Number() para reflejar el estado real ([`9a060bb`](https://github.com/mitienda-pe/mitienda-admin/commit/9a060bb5154a95da2026b92c562b9f612ec6ec8a))
- **doppler:** quitar import AppButton sin usar (rompía vue-tsc) ([`d830c15`](https://github.com/mitienda-pe/mitienda-admin/commit/d830c154ceeeb397a96a28940c39e442fe9c7eb9))
- **payment-gateways:** permitir eliminar billeteras QR apagando ambas ([`7e1af85`](https://github.com/mitienda-pe/mitienda-admin/commit/7e1af853fdbb53014d6c1d72283e508a53adf66b))
- **csp:** permitir conexión a llmproxy.mitienda.host para AI-Text-Enhancer ([`d08d8ac`](https://github.com/mitienda-pe/mitienda-admin/commit/d08d8ac557c5d6688c152eee23e777e61141e473))
- **csp:** permitir YouTube/Vimeo en frame-src para preview de video (v2.39.15) ([`c8adf0d`](https://github.com/mitienda-pe/mitienda-admin/commit/c8adf0dc204ad7248bba7262620ae9c623eb128a))
- **niubiz:** corregir descripción errónea (no es del BBVA) ([`c8282b1`](https://github.com/mitienda-pe/mitienda-admin/commit/c8282b10a02efe99cb3c299ed170e4577f5f9558))
- **carousel:** forzar tamaño mínimo del canvas recortado para evitar 400 ([`6cd1a6d`](https://github.com/mitienda-pe/mitienda-admin/commit/6cd1a6d0a94883dc06f11b0be987cf18d221c178))
- **billing:** IGV por afectación en totales de emisión manual ([`7bdd327`](https://github.com/mitienda-pe/mitienda-admin/commit/7bdd327b6c21343c2950c993d208d2da8ba7901f))
- **orders:** mostrar IGV por afectación en detalle de pedido (no sobre el total) ([`f0239fe`](https://github.com/mitienda-pe/mitienda-admin/commit/f0239fe01af7f94b5e4d9fa8ac5067e14d4bd0a0))
- **ui:** evitar que el icono de búsqueda se monte sobre el placeholder ([`4f235b7`](https://github.com/mitienda-pe/mitienda-admin/commit/4f235b7b6ec9a52dc9490d5bd5a58f2d5713b31c))
- **appearance:** evitar que la barra de cambios sin guardar tape el final del formulario ([`125bdaa`](https://github.com/mitienda-pe/mitienda-admin/commit/125bdaad98956711c9465b39d4ca0074b69393cf))
- **orders:** consultar pagos NetSuite vía endpoint autenticado ([`744a584`](https://github.com/mitienda-pe/mitienda-admin/commit/744a584b880f6e3473b197581ba5ade3bc8020fa))

## [v2.39.4] - 2026-06-12

_Sin cambios relevantes._

## [v2.39.3] - 2026-06-12

### Correcciones

- **builder:** actualizar mtbuilder a ^1.2.0 (emite html en content-changed) ([`4724ad9`](https://github.com/mitienda-pe/mitienda-admin/commit/4724ad918d34b3439b2b1c88f541184c2bd68e7b))

## [v2.39.2] - 2026-06-12

### Correcciones

- **builder:** guardar html como string vacío si el builder no lo emite ([`0a6eedf`](https://github.com/mitienda-pe/mitienda-admin/commit/0a6eedfb17f3b1078f5e729e9c5a409a38b7df30))

## [v2.39.1] - 2026-06-11

### Novedades

- **router:** títulos de página por ruta para GA4 ([`2c4a7d2`](https://github.com/mitienda-pe/mitienda-admin/commit/2c4a7d2fd3f8881fa8e44a9e7d7f0412a46a78be))

### Correcciones

- **ci:** aprobar build de workerd para el deploy a Cloudflare Pages ([`1570f80`](https://github.com/mitienda-pe/mitienda-admin/commit/1570f809b31aecda74b1613da385869a6d1a804a))

## [v2.39.0] - 2026-06-11

### Novedades

- **marketing:** vista de configuración de recuperación de carritos ([`f8f0c87`](https://github.com/mitienda-pe/mitienda-admin/commit/f8f0c873194de6ad0a41267d461d6e5a2ad7eebc))
- **notificaciones:** toggle para enviar avisos solo al email configurado ([`ca213de`](https://github.com/mitienda-pe/mitienda-admin/commit/ca213def9084a03683088d7b121d44f38e9f20c2))
- **marcas:** guarda al borrar marca en uso (reasignar o dejar sin marca) ([`9b9a736`](https://github.com/mitienda-pe/mitienda-admin/commit/9b9a736715017472f7f195e3bbb67951e7b1948f))
- **promotions-v2:** estado más visible con badge vívido + icono ([`e8e98ff`](https://github.com/mitienda-pe/mitienda-admin/commit/e8e98ffdf94afcacc4e7ea9d2a7e89e65e7412bc))
- **promotions-v2:** avisar regalos no entregables (variantes/sin stock) ([`ba3b75e`](https://github.com/mitienda-pe/mitienda-admin/commit/ba3b75ea44bf1286f69fce053c372cb58b477c4d))
- **productos:** botón "Reindexar buscador" en la lista de productos ([`4a8bb0f`](https://github.com/mitienda-pe/mitienda-admin/commit/4a8bb0f021873f23ee64cb0c16ae67b792235576))
- **productos:** botón eliminar producto (soft delete) en el detalle ([`2ac1fe9`](https://github.com/mitienda-pe/mitienda-admin/commit/2ac1fe9b152d06d3771218b204f56b4b27f53eeb))
- **apariencia:** sección "CSS personalizado" con editor Monaco ([`77c9aa6`](https://github.com/mitienda-pe/mitienda-admin/commit/77c9aa6c232fa561efa79bef6a9ecc8a4ae7a33b))
- **orders:** distinguir total de venta vs efectivo cobrado y reporte de redondeo POS ([`d0f4aaf`](https://github.com/mitienda-pe/mitienda-admin/commit/d0f4aaf2ce1017950db023b417a7130bba83f35c))
- **stock:** UI de gestión de stock por sucursal (Etapa 2 multi-sucursal) ([`6d5de40`](https://github.com/mitienda-pe/mitienda-admin/commit/6d5de40b203ffa3a44d5010a522a535e57bac6c2))
- **netsuite:** botón "Importar productos nuevos" con modal de preview ([`511e667`](https://github.com/mitienda-pe/mitienda-admin/commit/511e667347f2ed0f57adf2990d0eea2b9790d2e8))
- **menu:** retirar entrada Promociones (legacy) ([`961d5a1`](https://github.com/mitienda-pe/mitienda-admin/commit/961d5a13cc88f66b4728e0d5f2154caebacc9d31))
- **reports:** vista de análisis de rechazos de pago ([`e7234d1`](https://github.com/mitienda-pe/mitienda-admin/commit/e7234d175439ac4ab66988eab62afab7b100a05d))

### Correcciones

- **notificaciones:** evita que el toggle de copia se comprima (shrink-0) ([`2e15b0b`](https://github.com/mitienda-pe/mitienda-admin/commit/2e15b0b88765c5ab8d4d3b17214db37e76782e1e))
- **productos:** mostrar mensaje real de validacion del backend ([`49c81ec`](https://github.com/mitienda-pe/mitienda-admin/commit/49c81ec1807900f072fcf777e99a5cc98c5db509))
- **promotions-v2:** aplicar defaults de schema + validar requeridos en efectos ([`c70a51d`](https://github.com/mitienda-pe/mitienda-admin/commit/c70a51dca1cde7e0c5e6772bd4a84aa42f80ffcd))
- **csp:** permitir iframe de Cloudflare Stream (subdominio customer-*) ([`f816e3b`](https://github.com/mitienda-pe/mitienda-admin/commit/f816e3bfb5b6e4a894d92612117a4befef64c214))
- **productos:** polling tras subir video hasta que esté disponible ([`3782246`](https://github.com/mitienda-pe/mitienda-admin/commit/37822469b218d1abe1dfea475764cea575230119))
- **productos:** texto de duración máxima de video 40s→45s ([`f0ad65d`](https://github.com/mitienda-pe/mitienda-admin/commit/f0ad65da26f27cb5f40c2e0c950fe30d74acae70))
- **backoffice:** permitir blob: en CSP connect-src para el cropper de imágenes ([`a2b8494`](https://github.com/mitienda-pe/mitienda-admin/commit/a2b84942a0a8baadaadbb3235fb3e146e85bc16a))
- **orders:** mostrar el % de descuento real por línea, no el monto ([`96b221b`](https://github.com/mitienda-pe/mitienda-admin/commit/96b221b4a540fcf37a5c495733d5136ff9b9af25))
- **plan:** boundary check en isRouteAccessible para evitar prefix collisions ([`c53ff43`](https://github.com/mitienda-pe/mitienda-admin/commit/c53ff43b9137501682229df407820d336b0c95d8))
- **promotions-v2:** mostrar montos en soles y agregar modo de regalo (auto/BOGO) ([`c53da7d`](https://github.com/mitienda-pe/mitienda-admin/commit/c53da7daf63767729f64fdce5a1b25d2e75cf4fa))
- **products:** reordenar el catálogo completo, no solo la página visible ([`950f5cb`](https://github.com/mitienda-pe/mitienda-admin/commit/950f5cbe9a332821686732f1c2a60904c503119a))
- **promotions-v2:** no borrar product_ids al editar el porcentaje del efecto ([`bdce957`](https://github.com/mitienda-pe/mitienda-admin/commit/bdce957ea096b4b47a6bdc7da165aafc7701b583))
- **promotions-v2:** permitir decimales en porcentaje de descuento ([`b8f9e5a`](https://github.com/mitienda-pe/mitienda-admin/commit/b8f9e5a8e48227e3ae6af3d59be87f770a972f76))
- **netsuite:** persistir preferencia delegate_billing al guardar credenciales ([`cdb5f54`](https://github.com/mitienda-pe/mitienda-admin/commit/cdb5f54ea11f9be70d77d401a939ecccccebbf72))
- **products:** blindar slugify() ante slug undefined en el formulario ([`a3c77bb`](https://github.com/mitienda-pe/mitienda-admin/commit/a3c77bb050ec9719644697fd289b51ae081f3488))
- **csp:** permitir cdn.jsdelivr.net (marked), cdn.tiendabox.co y OneSignal ([`7e12bfd`](https://github.com/mitienda-pe/mitienda-admin/commit/7e12bfdbbd75b709d6f190ee4ee31c461dcc7e3a))
- **products:** normalizar slug a ASCII en el formulario de edición ([`2e3e181`](https://github.com/mitienda-pe/mitienda-admin/commit/2e3e18159aa97f96c3a7f8b7a23c3f19b8912144))
- **kasnet-qr:** botón 'Activar' visible para tiendas no configuradas ([`1ecd481`](https://github.com/mitienda-pe/mitienda-admin/commit/1ecd48145e87a3878875d7a2618e121ad515ce92))
- **auth:** permitir acceso a /forgot-password y /reset-password sin autenticación ([`43c0449`](https://github.com/mitienda-pe/mitienda-admin/commit/43c04491d1321b0ed6d40ad2f3f195916ac0e180))

## [v2.38.32] - 2026-05-26

### Novedades

- **promotions-v2:** ocultar toggle stackable (política no-stacking) ([`d826835`](https://github.com/mitienda-pe/mitienda-admin/commit/d826835288f01a6a428e20fbb08b60e321bc5124))
- **promotions:** banner deprecación en /marketing/promotions legacy ([`9e9ef30`](https://github.com/mitienda-pe/mitienda-admin/commit/9e9ef304dbbd83e2f024b9dce1c4384bf390fc1f))
- **router:** aplicar gating de módulos también durante impersonación ([`5a6f78e`](https://github.com/mitienda-pe/mitienda-admin/commit/5a6f78e729fc9a956ffe5fb4fc6fc60707932992))

### Correcciones

- **orders:** mostrar estado Anulado en vez de Pendiente al anular venta POS ([`9fdef2e`](https://github.com/mitienda-pe/mitienda-admin/commit/9fdef2ed41be161fcd61d9fcd5f8247bdd75c802))
- **promotions-v2:** remover import Checkbox no usado ([`5ad9e7d`](https://github.com/mitienda-pe/mitienda-admin/commit/5ad9e7d2c0940b9b9c39369585bee9d71aa38c82))

## [v2.38.27] - 2026-05-25

### Novedades

- **header:** enlazar nombre de tienda al storefront y mostrar ID para soporte ([`fbbcfef`](https://github.com/mitienda-pe/mitienda-admin/commit/fbbcfef4cbe750d36686c8a2f1ad48d36c918846))
- **marketing:** unificar cupones y promociones V2 con plan gating granular ([`8d5269c`](https://github.com/mitienda-pe/mitienda-admin/commit/8d5269c13053d525851ea265c24127d360231b3b))
- **carrusel:** editor inline de aspect ratio por slide ([`ff78ca6`](https://github.com/mitienda-pe/mitienda-admin/commit/ff78ca6785e0647e54c291dcf9409b116cdbc9ac))
- **carrusel:** permitir proporciones legacy 4:1, 3:1, 2:1 en desktop ([`5524226`](https://github.com/mitienda-pe/mitienda-admin/commit/5524226002299f3af1d5eec49585f88c5deafdb8))
- **plans:** separar gating de tarifas de envío y courier avanzado ([`090d5a7`](https://github.com/mitienda-pe/mitienda-admin/commit/090d5a736e450c429f9dae2e650ee8e82f7510e5))
- **domain:** advertir contra registros AAAA en la configuración de dominio ([`b3c2a3f`](https://github.com/mitienda-pe/mitienda-admin/commit/b3c2a3f67cf11d3008c659cd2a09439b69416df5))
- **integrations:** gate provider categories by plan ([`18e19f8`](https://github.com/mitienda-pe/mitienda-admin/commit/18e19f836dd8979da7af8d8dde6c7dc1614133f9))
- **pdv:** gatear menú POS por mod_pos ([`4b165b6`](https://github.com/mitienda-pe/mitienda-admin/commit/4b165b6a0520787896c8af7a52bde4b646be238a))
- **health:** emit /health.json for external uptime monitoring ([`5e72e8d`](https://github.com/mitienda-pe/mitienda-admin/commit/5e72e8d4165b7f7b06f0cb1856738a667677f6cf))
- **store-config:** toggle "Pedir por WhatsApp en ficha de producto" ([`5cf17fd`](https://github.com/mitienda-pe/mitienda-admin/commit/5cf17fdac6ccca30bfe4a7af029bcd5b27d6d2de))
- **content/messages:** toggle HTML / Visual en QuillEditor (v2.38.17) ([`784f8b7`](https://github.com/mitienda-pe/mitienda-admin/commit/784f8b73b0472b63009774899e71544b95c50dd5))
- **integrations:** icono para provider icomm_omnichannel ([`cd0d7ed`](https://github.com/mitienda-pe/mitienda-admin/commit/cd0d7ed646e48d43135944eddc8f336680bfb9f4))
- **products:** toggle "Destacado" en detalle de producto ([`56a2aed`](https://github.com/mitienda-pe/mitienda-admin/commit/56a2aed7e628f66da5a0cfbc7172e41f760b7a22))
- **orders:** comentarios del seller sobre pagos de órdenes ([`ac7adf0`](https://github.com/mitienda-pe/mitienda-admin/commit/ac7adf0eb88c16361291bcae0ed2304f80a9a4ea))
- **integrations/chat-ia:** registrar Asistente IA MiTienda en bloque Chat en vivo ([`15eb34f`](https://github.com/mitienda-pe/mitienda-admin/commit/15eb34ff2954af9118bfbcd4807971385737274d))
- **dispatch:** mostrar variante en picking list y vista de despacho ([`f96d05f`](https://github.com/mitienda-pe/mitienda-admin/commit/f96d05f9c4bf1af40e7381d059b7806097835b1b))
- **orders:** mostrar variante en detalle de venta ([`ce6bb65`](https://github.com/mitienda-pe/mitienda-admin/commit/ce6bb65e45d039bc2280ca2aa3516573d1637ab4))
- **costa-rica:** countryConfig dinámico (moneda, IVA, labels territoriales) ([`a8c06ba`](https://github.com/mitienda-pe/mitienda-admin/commit/a8c06ba7a9f0eddc1459d61ea18169b397cc4be3))
- **netsuite:** banners severity-aware (rojo críticos / amarillo warnings) ([`2857d06`](https://github.com/mitienda-pe/mitienda-admin/commit/2857d06c30efe7d24ddf41b7ca257f9c0f95f17b))
- **netsuite:** formulario completo de credenciales + validación de IDs faltantes ([`84f11bf`](https://github.com/mitienda-pe/mitienda-admin/commit/84f11bf1d09332ab023d76ea7360d5fc4ae2b4cf))
- **kasnet-qr:** toggle aggregator/propio en configuración de pasarela ([`74d8f64`](https://github.com/mitienda-pe/mitienda-admin/commit/74d8f64a3c1e5cce436cad2c724142e7605f22be))
- **payment-gateways:** show public Niubiz sandbox credentials in form when env=integracion (v2.38.8) ([`1c602c7`](https://github.com/mitienda-pe/mitienda-admin/commit/1c602c73874bf4eeb75e75fc1df105bd3fd6c7a5))
- **payment-gateways:** close gaps between backoffice forms and api2 PaymentGatewayMap (v2.38.7) ([`1585fec`](https://github.com/mitienda-pe/mitienda-admin/commit/1585fecc193f26fffa959457eae96de5c6420c47))
- **payment-gateways:** add Password field to Niubiz form, clarify Access Key label (v2.38.6) ([`94e8259`](https://github.com/mitienda-pe/mitienda-admin/commit/94e82591ee167754fa3e426575f40861caf338fb))
- **payment-gateways:** toggle gateways from the list view without opening credentials form (v2.38.5) ([`dc29eb8`](https://github.com/mitienda-pe/mitienda-admin/commit/dc29eb878e8737f158b61e419a73ee88b03b8204))
- **payment-gateways:** add REST password and environment fields to Izipay config (v2.38.4) ([`22f39e7`](https://github.com/mitienda-pe/mitienda-admin/commit/22f39e7c688f8a0d7de393b7fa79aabde7a212e7))
- **products:** drag-and-drop image reordering ([`c6f16f6`](https://github.com/mitienda-pe/mitienda-admin/commit/c6f16f6df41fdebce6d363af01d5bab7e62eedd4))
- **products:** show SKU availability inline before submit ([`5abb917`](https://github.com/mitienda-pe/mitienda-admin/commit/5abb917ce1f2a2d1a1752e66ce5b21e45c5aa658))

### Correcciones

- **loyalty:** conservar estado del toggle al recargar la vista ([`0247002`](https://github.com/mitienda-pe/mitienda-admin/commit/0247002595fca8af1c3e081913978ae35fe53166))
- **pos:** exponer VITE_POS_URL en build y agregar fallback ([`f85bbe2`](https://github.com/mitienda-pe/mitienda-admin/commit/f85bbe23442cceea5b174e1dde061aaf7604d79c))
- **orders/payment-comments:** chequear success en vez de error tras interceptor ([`3f0c4fb`](https://github.com/mitienda-pe/mitienda-admin/commit/3f0c4fbb5cee27c6ec6fdd97c04cca329f52a783))
- **web-analytics:** mostrar conteos en funnel cuando rate=0 y capear pasos ([`4ae7162`](https://github.com/mitienda-pe/mitienda-admin/commit/4ae71629c49ff250ae4c52870d653957610982c5))

### Refactor

- **orders:** comentarios del pago como resumen inline + dialog ([`4747d62`](https://github.com/mitienda-pe/mitienda-admin/commit/4747d624fa550e400c56a77005ce1b8c386175c3))

## [v2.38.1] - 2026-05-12

### Novedades

- **billing:** habilitar UI de Bizlinks como proveedor de facturación ([`73bd68d`](https://github.com/mitienda-pe/mitienda-admin/commit/73bd68d68529024de8fe196a05c82e0b8efa8eef))
- **pos:** módulo POS en backoffice (cajeros + sucursales + abrir POS) ([`149fe9e`](https://github.com/mitienda-pe/mitienda-admin/commit/149fe9e632485f6962d45f914d97fc4ed080e1b3))
- **orders,dispatch:** etiqueta Olva descarga PDF (no abre HTML) ([`838f4cd`](https://github.com/mitienda-pe/mitienda-admin/commit/838f4cdf12aaa90406898ecc317062d5b1dbd0bc))
- **netsuite:** botón eliminar serie en tab Series ([`0c252bb`](https://github.com/mitienda-pe/mitienda-admin/commit/0c252bb02bdb5d4855d3f9afc5f213e48f7e253e))
- **dispatch,couriers:** toggle manual/auto + acciones Olva en detalle ([`711cfc9`](https://github.com/mitienda-pe/mitienda-admin/commit/711cfc9fc15eea2698506145348c2a217b9b48e6))
- **dispatch:** mostrar foto de prueba de entrega en detalle ([`7e52b64`](https://github.com/mitienda-pe/mitienda-admin/commit/7e52b648aaf863e8bc2173804fd5ba5e3955a173))
- **netsuite:** comparar precios y sync manual tienda-wide ([`ab5c7b2`](https://github.com/mitienda-pe/mitienda-admin/commit/ab5c7b20977548aa3de9059da38118832a710ab5))
- **payment-gateways:** logo de Kasnet en lista y form de config ([`0b16d88`](https://github.com/mitienda-pe/mitienda-admin/commit/0b16d8813bd2da52991da8c36fda3b51530a172d))
- **orders:** vista en tabla con filtro y orden por facturación ([`2d8c488`](https://github.com/mitienda-pe/mitienda-admin/commit/2d8c48889898775dc0caabb300d6e636a38776b8))
- **payment-gateways:** registra Kasnet QR en backoffice ([`5d95fc1`](https://github.com/mitienda-pe/mitienda-admin/commit/5d95fc1f36a455caa8bd568675de6ee92a8a533a))
- **orders:** timeline lee shipping_history real (no hardcoded por status) ([`f072c32`](https://github.com/mitienda-pe/mitienda-admin/commit/f072c32236eb898ff5ada5df1fceaddf50d2e210))
- **ui:** boton primario y guardar con fondo turquesa ([`19bbc31`](https://github.com/mitienda-pe/mitienda-admin/commit/19bbc317851a737d826e17614ca1361dc061ea03))
- **orders:** UI Olva — banner error+retry y prueba de entrega ([`c6ad947`](https://github.com/mitienda-pe/mitienda-admin/commit/c6ad9470faddb5e55776e1b5cdc18e81463b7c4c))
- **orders:** boton "Etiqueta Olva" en detalle de orden ([`637c02b`](https://github.com/mitienda-pe/mitienda-admin/commit/637c02bf45e4e5fa788f7f910424837b2ac40cfd))
- **couriers:** agregar configuracion de Olva Courier en backoffice ([`edd3e45`](https://github.com/mitienda-pe/mitienda-admin/commit/edd3e4527ec56073295691b0a75ef8552c991e9b))
- **netsuite:** UI para overrides de series y generic customer por sucursal ([`864780e`](https://github.com/mitienda-pe/mitienda-admin/commit/864780ec78cf347a54ecb08f509f7dec6c25cd43))
- **plugins:** backoffice integration for plugin framework ([`7486b03`](https://github.com/mitienda-pe/mitienda-admin/commit/7486b03d17a26ba0467e0b2239988e3ef855e99f))
- **support:** add Tawk.to live chat widget and stack HelpFab above it ([`8e1ebea`](https://github.com/mitienda-pe/mitienda-admin/commit/8e1ebeac00199a11d8101dac6f37dcdea1ec3dbb))
- **help:** add WhatsApp support pill in help drawer header ([`d313e05`](https://github.com/mitienda-pe/mitienda-admin/commit/d313e053d1cfadb8c9822ff9cb4fba7f31dd4952))
- **store:** toggle WhatsApp FAB from store info settings ([`c50afc0`](https://github.com/mitienda-pe/mitienda-admin/commit/c50afc06f4ec87c9ffdefe7d3f851f193d9796c3))
- **appearance:** add email logo uploader (PNG/JPG/WebP) ([`e16b2b6`](https://github.com/mitienda-pe/mitienda-admin/commit/e16b2b624e8c303a619e7d36c3a8ef2b09e6f059))

### Correcciones

- **dispatch:** etiqueta Olva via apiClient (manda JWT) ([`4fb02b0`](https://github.com/mitienda-pe/mitienda-admin/commit/4fb02b06a8eda5346920fcb069f941315e131e33))
- **payment-gateways:** saveCredentials refresca currentConfig ([`2bf3bb0`](https://github.com/mitienda-pe/mitienda-admin/commit/2bf3bb00de6e26fecaa810f0fe1ceb3ba46fd360))
- **payment-gateways:** import ref de Vue para Kasnet form ([`d979425`](https://github.com/mitienda-pe/mitienda-admin/commit/d979425178b7f966fdba72a760e731cc7f19a00e))
- **payment-gateways:** no pre-llena api_key enmascarada en form Kasnet ([`67836c4`](https://github.com/mitienda-pe/mitienda-admin/commit/67836c430ad8feacfde60cf6a56b53209970eef9))
- **shipping:** coerciona swalmacen/swpublicado a numero al detectar puntos de recojo ([`e525905`](https://github.com/mitienda-pe/mitienda-admin/commit/e5259051a2e102423baab60d81afd874a56d8041))
- **shipping:** bloquea toggle Recojo en Tienda sin puntos de recojo ([`a2ae6d6`](https://github.com/mitienda-pe/mitienda-admin/commit/a2ae6d6f76dff665b48875672febfa6dff36f1b2))
- **orders:** timeline combina shipping_history + sintesis (no reemplaza) ([`ed92752`](https://github.com/mitienda-pe/mitienda-admin/commit/ed92752c29e4ced989eac7708213da1ac59e69d8))
- **orders:** etiqueta Olva reemplaza a la generica para courier_id=9 ([`7d8c0ee`](https://github.com/mitienda-pe/mitienda-admin/commit/7d8c0ee8792b1781615e8c17facf86254f8f94a3))
- **auth:** unificar Google OAuth client ID en proyecto mitienda-vendedor ([`305d765`](https://github.com/mitienda-pe/mitienda-admin/commit/305d7656260d643beb6a5d2cf3a8e75e6eb903b6))
- **netsuite:** comparar tiendadireccion_id como number en getBranchConfig ([`105d067`](https://github.com/mitienda-pe/mitienda-admin/commit/105d067b4cd108441e2e5c0bb39722551deaa8bf))
- **netsuite:** no enviar header Cache-Control desde el cliente ([`8c75d10`](https://github.com/mitienda-pe/mitienda-admin/commit/8c75d100a4cfa07f1eb9bcb985700cb5c41b191a))
- **netsuite:** cache buster en getBranchesConfig ([`3dd7598`](https://github.com/mitienda-pe/mitienda-admin/commit/3dd759812d28fa844591c67265dfcd2a9b666d2b))
- **plugins:** typescript errors for backoffice build ([`a72419d`](https://github.com/mitienda-pe/mitienda-admin/commit/a72419db542cd013ba8081f020e03ab4a2b3331c))
- **plugins:** use pi-microchip icon in sidebar ([`560a084`](https://github.com/mitienda-pe/mitienda-admin/commit/560a0844e9ef8f68b5dac9bd3c23eff7849663cf))
- **product-description:** stop losing AI-generated content on save ([`b12ec2f`](https://github.com/mitienda-pe/mitienda-admin/commit/b12ec2f99dddfa9339586a4fda5b3b60d7c7ca44))
- **ai-enhancer:** bump ai-text-enhancer to 1.2.1 to fix createObjectURL crash ([`737aa55`](https://github.com/mitienda-pe/mitienda-admin/commit/737aa5530f60ee54238adf00fc3cc2152be6183d))
- **orders:** move chargeback button to payment card, credit card only ([`d8b9434`](https://github.com/mitienda-pe/mitienda-admin/commit/d8b9434d3c5966336e74dda4e0011e238d5c48af))
- **help:** restore HelpFab to bottom-6 since Tawk.to handles its own position ([`3542fc9`](https://github.com/mitienda-pe/mitienda-admin/commit/3542fc9c93404e7e4c6eb573f2543fa1cf5066ac))
- **help:** add right margin to support pill so it doesn't overlap close button ([`c742061`](https://github.com/mitienda-pe/mitienda-admin/commit/c742061e7d3c96f3dbccdb7d509cb8be8c7a6718))

### Refactor

- **dispatch:** unificar UI del módulo de Despacho con la de Pedidos ([`e4ad04c`](https://github.com/mitienda-pe/mitienda-admin/commit/e4ad04ceb3863019e8c3f218291ef6aef52eaec0))

## [v2.36.1] - 2026-04-21

### Novedades

- **ui:** migrate remaining config views to UnsavedChangesBar ([`fae7b47`](https://github.com/mitienda-pe/mitienda-admin/commit/fae7b470b77248afd49f9f93565c52eb2e668eed))

## [v2.36.0] - 2026-04-21

### Novedades

- **ui:** sticky UnsavedChangesBar for gateway and courier configs ([`07dd8f1`](https://github.com/mitienda-pe/mitienda-admin/commit/07dd8f14ecd4a4ea8b1b306a338ccb4d2087b84d))

## [v2.35.0] - 2026-04-21

### Novedades

- **config:** dirty-form tracking for gateway, courier and shipping configs ([`16c233b`](https://github.com/mitienda-pe/mitienda-admin/commit/16c233b5299aac7f42b473f61639d627212ae17a))

## [v2.34.3] - 2026-04-21

Primera version etiquetada. Lo anterior esta en el historico.

---

# Historico (previo al versionado)

## Abril 2026

### Novedades

- **catalog:** redirect to edit mode after create for image upload ([`fa47baa`](https://github.com/mitienda-pe/mitienda-admin/commit/fa47baa950b80cbdee8f22840c5027542e1da599))
- **broadcasts:** render Markdown in bar and modal ([`940858b`](https://github.com/mitienda-pe/mitienda-admin/commit/940858bdabbda4a80dcdbc052388cf3bd716f50d))
- render superadmin broadcasts as bars and modals ([`e35c7bd`](https://github.com/mitienda-pe/mitienda-admin/commit/e35c7bd74340b17f8dd02f9ffe4da1f3a9826e4a))
- configurable predefined blocks in template builder ([`35f3db4`](https://github.com/mitienda-pe/mitienda-admin/commit/35f3db4f72dfaa2af5b5381a6def7271736f821c))
- add Combos as predefined block in template builder ([`df760c4`](https://github.com/mitienda-pe/mitienda-admin/commit/df760c4e234fc2c56e8343ce8fcf37bee8b47daa))
- add "Crear producto" button and simplify description field ([`20a4ea9`](https://github.com/mitienda-pe/mitienda-admin/commit/20a4ea959cd7126e5bdf8a44f0a4e8c6fa5916ec))
- add version check system with update banner and chunk error recovery ([`975f255`](https://github.com/mitienda-pe/mitienda-admin/commit/975f2553f6eef6fd0d7a698360a5912d8367db6a))
- add "Mis Tiendas" view — list stores, switch store, create new store ([`2722944`](https://github.com/mitienda-pe/mitienda-admin/commit/2722944c6c9d568001d8b9cb05e31fb27647ed3b))
- filter out products with variants from combo product search ([`27c3e09`](https://github.com/mitienda-pe/mitienda-admin/commit/27c3e09d3d7e305a5a8b6ac6c2209db357720148))
- add multi-country branding and Caddy/GitHub Actions deployment ([`9178f1d`](https://github.com/mitienda-pe/mitienda-admin/commit/9178f1df87a492bc7a230606f3f0daa96b50244b))
- add conversion funnel to web analytics dashboard ([`05cf50f`](https://github.com/mitienda-pe/mitienda-admin/commit/05cf50f1fe1b0b853bb0318a15c720bc494c4722))
- gate web analytics behind mod_analitica_web module ([`c79ddb3`](https://github.com/mitienda-pe/mitienda-admin/commit/c79ddb3af043f223997a91ac975e992053cf4fa7))
- add web analytics dashboard in reports section ([`9c05ac9`](https://github.com/mitienda-pe/mitienda-admin/commit/9c05ac96ae7967ab43f018436b912638a94433d0))
- add Playwright E2E test suite (46 tests, 8 modules) ([`dd0907e`](https://github.com/mitienda-pe/mitienda-admin/commit/dd0907e44377298437a646246b42327d13c3663d))
- cutoff time configuration per service type in shipping config ([`1c7e0b2`](https://github.com/mitienda-pe/mitienda-admin/commit/1c7e0b254c41fbbe3bab2caecafbaae2a6e3a442))
- courier routing rules UI in backoffice ([`c4e2f85`](https://github.com/mitienda-pe/mitienda-admin/commit/c4e2f85ead1e576ab15733e72ace110fe685ad55))
- pencil opens service rates when enabled, pre-populate standard ([`977cfe6`](https://github.com/mitienda-pe/mitienda-admin/commit/977cfe682a6532a01fa29d7c15820cc69dafcf0f))
- use real API data for shipping rates tree, fix service rates dialog UI ([`027f187`](https://github.com/mitienda-pe/mitienda-admin/commit/027f187175e1c54ec28cc35a35f5df27aa017624))
- add minutes as delivery time unit option in service rates ([`50e7cb8`](https://github.com/mitienda-pe/mitienda-admin/commit/50e7cb88e5a47114c58278d89c2be32fa0004d6c))
- add service type rates configuration in backoffice ([`0ea3ff3`](https://github.com/mitienda-pe/mitienda-admin/commit/0ea3ff3690e72e1923e1e45932bce0ee887875ab))

### Correcciones

- **orders:** route manual payment confirmation to /payment-status endpoint ([`b60251a`](https://github.com/mitienda-pe/mitienda-admin/commit/b60251a1837e6712d8a7482bb7ff29c6f7b4cd15))
- **broadcasts:** allow broadcast modal to scroll for long content ([`d06ac8c`](https://github.com/mitienda-pe/mitienda-admin/commit/d06ac8cf7272fd47ce61a8315992ce14ef215bbb))
- reset pagination to page 1 when searching in NetSuite stock view ([`07928ac`](https://github.com/mitienda-pe/mitienda-admin/commit/07928acbdb11194f4338e0cf575c0cb83d41fa8d))
- handle NaN in stock diff calculation ([`6e05089`](https://github.com/mitienda-pe/mitienda-admin/commit/6e05089522c592f1bf3bad911c1809c3bf4a99cf))
- improve chunk loading error detection for MIME type mismatches ([`fba6e0c`](https://github.com/mitienda-pe/mitienda-admin/commit/fba6e0c58c8f90a83ed811590cb1b8fb97b7cf48))
- correct field mapping for listas, combos, and gamas in block config ([`29305af`](https://github.com/mitienda-pe/mitienda-admin/commit/29305afbcbe72923c8d03a90948a49bda75a23a4))
- upsale toggle display and list counts ([`00d270f`](https://github.com/mitienda-pe/mitienda-admin/commit/00d270f54dcff0eb46769283c304b5f91b35cdde))
- remove overflow-hidden that was truncating description, use word-break instead ([`15d2cc2`](https://github.com/mitienda-pe/mitienda-admin/commit/15d2cc2f71093d8c939dece22cc91c7201bace95))
- prevent long description from overflowing due to &nbsp; entities ([`b0c8696`](https://github.com/mitienda-pe/mitienda-admin/commit/b0c86968f0a420735fe652385bff429ebf7eda13))
- rename description card title to "Descripción larga" ([`cbfc5b2`](https://github.com/mitienda-pe/mitienda-admin/commit/cbfc5b280e4c423180b8e11da148d81eb3c11a5f))
- always show description block in product detail ([`69b1ad6`](https://github.com/mitienda-pe/mitienda-admin/commit/69b1ad6a3dcc6ca90c4654fcb73dfd637be570dd))
- resolve TypeScript error in combo form data type ([`b34333e`](https://github.com/mitienda-pe/mitienda-admin/commit/b34333e31dba54381e29f3ca2c3291b2e80fcbad))
- send null image to backend when combo image is removed ([`5c67f0d`](https://github.com/mitienda-pe/mitienda-admin/commit/5c67f0d4d0798d88201e339c609fa4b71c61577c))
- use correct Product type field for variant check in combo search ([`7af764a`](https://github.com/mitienda-pe/mitienda-admin/commit/7af764a6539c1c898940227a4e8806a7e425b21e))
- correct strict equality for combo toggle values from API ([`c894923`](https://github.com/mitienda-pe/mitienda-admin/commit/c894923d21eaf7027abe1791e6147de2a809b7bc))
- update TiendaBox logo SVG ([`8aed323`](https://github.com/mitienda-pe/mitienda-admin/commit/8aed3236076bf8a8b388f57e5aec2e0ebe0286d6))
- read VITE_ env vars from vars (not secrets) in CI ([`66f439c`](https://github.com/mitienda-pe/mitienda-admin/commit/66f439c326b49aa50f46dab636b52032794c131e))
- read VITE_ env vars from secrets instead of vars in CI ([`e5284f5`](https://github.com/mitienda-pe/mitienda-admin/commit/e5284f546bd6ed4a03340cc5b870471b1cdfeebd))
- add missing logo-tiendabox.svg asset to repo ([`e9e21dd`](https://github.com/mitienda-pe/mitienda-admin/commit/e9e21dd1b0af518d96f3ad8825892a16e474e8bd))
- move Analítica Web link below Dashboard in sidebar ([`0e76f27`](https://github.com/mitienda-pe/mitienda-admin/commit/0e76f27b211842875c4ceb9ee5231648d79d8c4d))
- QA backoffice - resolve final 3 bugs (blog pagination, carousel errors, wishlist) ([`5752618`](https://github.com/mitienda-pe/mitienda-admin/commit/575261818b574ad4feb8197bd11c8c7477ac6a33))
- QA backoffice - resolve remaining 27 bugs (5 high, 22 medium) ([`772cc0e`](https://github.com/mitienda-pe/mitienda-admin/commit/772cc0e7091b5530df915a0aeff3824af200b16c))
- resolve TypeScript build errors + include pending billing/datil changes ([`fab3dd3`](https://github.com/mitienda-pe/mitienda-admin/commit/fab3dd3ea79144b999adb0c001f1d790ed0a27c5))
- QA backoffice low-priority - console.logs, design system colors, UX fixes ([`083def7`](https://github.com/mitienda-pe/mitienda-admin/commit/083def7f6a387254226fb70a19d60f32653812ac))
- QA backoffice - resolve 22 bugs (3 critical, 12 high, 7 medium) ([`749dc0a`](https://github.com/mitienda-pe/mitienda-admin/commit/749dc0a9c4b4178db23279964cc4e27eb522a922))
- map courier-providers response fields (id/name/code not courier_id/courier_nombre) ([`0136351`](https://github.com/mitienda-pe/mitienda-admin/commit/0136351877175ccc8b6318b79551f3fb125f2736))
- use size="small" instead of "sm" for AppButton ([`69ebf7a`](https://github.com/mitienda-pe/mitienda-admin/commit/69ebf7ae261c395bc9dd5d25d7a8a674837c1645))
- show all couriers in routing rules dropdown, not just configured ([`fb2e948`](https://github.com/mitienda-pe/mitienda-admin/commit/fb2e9483604b9bbeff474b04922e659f4676c452))
- add 'minutes' to DeliveryTimeUnit type ([`59214f4`](https://github.com/mitienda-pe/mitienda-admin/commit/59214f43ff40f4bf5c8c5d3ec55e584a83a3f2c7))
- parse tipo_tiempo as number to show correct unit on reload ([`eb07f05`](https://github.com/mitienda-pe/mitienda-admin/commit/eb07f05478ad1152541658745b88ff38d0b10392))
- service rates dialog layout — 3-column grid, no double borders ([`5cb51de`](https://github.com/mitienda-pe/mitienda-admin/commit/5cb51de89b7ec558e8af5c97ed8ad29df4d2fa7e))
- check response.data.success instead of error after axios interceptor ([`a3c2ee9`](https://github.com/mitienda-pe/mitienda-admin/commit/a3c2ee9de43a405625d374051215736e317e877c))
- use _enabled in mock branch of toggleRate ([`a9e7c55`](https://github.com/mitienda-pe/mitienda-admin/commit/a9e7c557410dc1431f8663a0fd1bc604c7ce3719))
- prefix unused toggleRate params with underscore ([`bbe9737`](https://github.com/mitienda-pe/mitienda-admin/commit/bbe97375152291494c5f04abff9cd684b310d6be))
- point base rate CRUD to /shipping-rates/base endpoints ([`25ac0dd`](https://github.com/mitienda-pe/mitienda-admin/commit/25ac0dd87496669190f1f4d8b0f06d95c89d4c5a))
- correct API paths from /shipping/rates to /shipping-rates ([`44eb600`](https://github.com/mitienda-pe/mitienda-admin/commit/44eb60001389b7fc6017fc65d4a5f286a7c5b057))
- use Dropdown instead of SelectButton for time unit in service rates ([`0cc1807`](https://github.com/mitienda-pe/mitienda-admin/commit/0cc18071cc0ed69607d7f937730c231f4cbf418c))
- add hours/days toggle per service type in rates dialog ([`caa8d7e`](https://github.com/mitienda-pe/mitienda-admin/commit/caa8d7e78de7d925c45c5f50304b287d11d425fe))
- handle undefined data in service types API response ([`fc08111`](https://github.com/mitienda-pe/mitienda-admin/commit/fc08111e59364bfc02b12fb8659b39587661521a))

### Refactor

- **broadcasts:** hide modal footer when there is no CTA ([`4406b2f`](https://github.com/mitienda-pe/mitienda-admin/commit/4406b2f34f1d724ec81d6ea084691e0343968b9d))
- make listas block multi-instance, remove product selection from productos_destacados ([`42f61a8`](https://github.com/mitienda-pe/mitienda-admin/commit/42f61a811f4c4a80d67ed65f54e435f9aadb8ef7))

## Marzo 2026

### Novedades

- show webhook URL in Powerpay config view for easy copy ([`2368852`](https://github.com/mitienda-pe/mitienda-admin/commit/23688525a178cadc11a735d5ec12e4a409929bc9))
- simplify constraints — remove non_stackable and inventory_limit ([`3e0383c`](https://github.com/mitienda-pe/mitienda-admin/commit/3e0383c847619454c3cf4d6800ae70e252c8a795))
- expand effects — shipping/category/brand/gamma discounts, gift product ([`b28830f`](https://github.com/mitienda-pe/mitienda-admin/commit/b28830fa771a299e65850c7100a567d14c5290c3))
- add two-panel product linker for product-level effects ([`dcf6f20`](https://github.com/mitienda-pe/mitienda-admin/commit/dcf6f20c323b12a71334a0a1a27b2e7f91a0548d))
- add card_brand and bin_bank conditions to promotions-v2 ([`4b09937`](https://github.com/mitienda-pe/mitienda-admin/commit/4b0993765cbfd9dd443a3df8f88c01204ec35907))
- update promotions-v2 conditions — add brand, remove segment ([`ae8bbc3`](https://github.com/mitienda-pe/mitienda-admin/commit/ae8bbc37116d29df23ddc154bd92bff0acca0f16))
- remove event activation, improve permalink, add none condition ([`d93b57c`](https://github.com/mitienda-pe/mitienda-admin/commit/d93b57c686480887f28ddbe7080dd8a562297013))
- limit activations to 1 per promotion in v2 ([`d153517`](https://github.com/mitienda-pe/mitienda-admin/commit/d153517fec7ee65087d02f76a82c42933b2280de))
- improve promotions-v2 UX — remove JSON config for known types ([`1faad06`](https://github.com/mitienda-pe/mitienda-admin/commit/1faad06651969c1d56373151549e3b8e97a5b508))
- add header/banner toggle switches to Powerpay config form ([`d7269ef`](https://github.com/mitienda-pe/mitienda-admin/commit/d7269ef9b83144b7b28ffab5e80d2ceddd03ec9e))
- add dropdown support for select fields in integration provider config ([`dd568fa`](https://github.com/mitienda-pe/mitienda-admin/commit/dd568fa1288081f133a9562d320bdda6aa201b68))
- add webhook URL display to payment gateway config views ([`3fd833f`](https://github.com/mitienda-pe/mitienda-admin/commit/3fd833fae09dc5638a8b6a2f176288b59183312c))
- add fulfillment provider picker and fix order status types ([`fe3cab9`](https://github.com/mitienda-pe/mitienda-admin/commit/fe3cab96f2f7f446b2581c4da547a0e7c9e031d5))
- add chargeback/refunded status display and manual chargeback action ([`33620c0`](https://github.com/mitienda-pe/mitienda-admin/commit/33620c02e443ec9c920a202e3bff7e537ce9629e))
- move variants before images + show webhook URL in gateway config ([`5f42345`](https://github.com/mitienda-pe/mitienda-admin/commit/5f423452a8deef4dc8d21041fb7951788bd3d1a0))
- replace P. Oferta with P. sin IGV in variant table ([`4ecd984`](https://github.com/mitienda-pe/mitienda-admin/commit/4ecd9841774e516c8dc8e12cffb29269d1cf638f))
- move variants card before images + auto-activate toggle ([`b888bf0`](https://github.com/mitienda-pe/mitienda-admin/commit/b888bf0d741cb17f66b3d24b1f9b5b59a1db05fd))
- add layout width control in catalog preferences ([`93b554a`](https://github.com/mitienda-pe/mitienda-admin/commit/93b554ab8323c5dd233a411b67cb590cdfcca6da))
- color preview adapts to logo position setting ([`a709700`](https://github.com/mitienda-pe/mitienda-admin/commit/a709700bd1638230508e56a9f6332a623f212710))
- add Conekta logo to gateway map ([`1c68ad6`](https://github.com/mitienda-pe/mitienda-admin/commit/1c68ad6e20c214ab6b6c843070b29effcb225c78))
- add image aspect ratio selector to product card appearance ([`49219ff`](https://github.com/mitienda-pe/mitienda-admin/commit/49219ff78a8cc1fc630058724dfa9bdeaaffa6e3))
- add confirm/reject payment buttons on order detail ([`73b2f36`](https://github.com/mitienda-pe/mitienda-admin/commit/73b2f364fd341d783d8cf1a541c04ddcfeeb5cad))
- split payment gateways into exclusive and complementary sections ([`eb8fdf0`](https://github.com/mitienda-pe/mitienda-admin/commit/eb8fdf051a788438d0f7f40f55b9ddcc04e7e688))
- replace JSON textarea with type-specific forms in Promotions V2 ([`04ea8a3`](https://github.com/mitienda-pe/mitienda-admin/commit/04ea8a31b4eeda2afbffdd814403a46505f04af4))
- connect payment gateways to real API, load existing credentials ([`50b70f6`](https://github.com/mitienda-pe/mitienda-admin/commit/50b70f6c7f2d20404c233366470f485f496518a2))
- add WhatsApp Business connection page with Embedded Signup ([`89315ee`](https://github.com/mitienda-pe/mitienda-admin/commit/89315ee8bf6acf01a38564af5c72b351b832724e))
- link dispatch route to help docs article ([`d4dff71`](https://github.com/mitienda-pe/mitienda-admin/commit/d4dff71d2d6b8c5e9fc4ceacb504759fcfc6f717))
- gate dispatch panel to Large plan (mod_panel_despacho) ([`f303383`](https://github.com/mitienda-pe/mitienda-admin/commit/f30338315ab210fe82e7332fc18f559229910648))
- add dispatch module with list/detail views and fix OrderDetailView build error ([`6b2a2c7`](https://github.com/mitienda-pe/mitienda-admin/commit/6b2a2c7ab216fd60e6ba5c87f6b9943a4708c3c7))
- add Wompi, Conekta, Flow, and dLocal backoffice config views ([`91f6ccf`](https://github.com/mitienda-pe/mitienda-admin/commit/91f6ccf3817b30f9a51cbce33da3e4a4fd16768e))
- add fulfillment management UI for WMS integrations ([`4f0189e`](https://github.com/mitienda-pe/mitienda-admin/commit/4f0189e625816d3170e548e244791445719a0430))
- add Transbank, PayU, and PayPhone gateway config views ([`5402b93`](https://github.com/mitienda-pe/mitienda-admin/commit/5402b93f7efe427b0b055fa6efcb3d8fc97ebfec))
- add age verification toggle in store config ([`5dc13fa`](https://github.com/mitienda-pe/mitienda-admin/commit/5dc13fa06d84dd9607b03b9bbd0d714ee55ed8de))
- add color picker and fix RadioButton visibility in attributes ([`2c3bf82`](https://github.com/mitienda-pe/mitienda-admin/commit/2c3bf8238eec206014372b39dcb5b5f2224731bc))
- unify integrations hub with payment gateways and courier providers ([`5e8467e`](https://github.com/mitienda-pe/mitienda-admin/commit/5e8467ef84207751e936832ef661b2d8d4533b07))
- add fulfillment category for 3PL integration providers ([`fff1497`](https://github.com/mitienda-pe/mitienda-admin/commit/fff1497bbe06fd0091aec5c96677588a2d93a6ca))
- display NetSuite-emitted billing documents in order detail ([`f4fc3c2`](https://github.com/mitienda-pe/mitienda-admin/commit/f4fc3c2ff0ee5b32ea603437989c024d98c82af5))
- gate product sub-routes to Medium plan, reorder sidebar ([`d8043bf`](https://github.com/mitienda-pe/mitienda-admin/commit/d8043bf1de8125c76911d63226fad0d15d74d7d9))
- gate loyalty to Large plan, use gift icon, wire help docs ([`a8a2341`](https://github.com/mitienda-pe/mitienda-admin/commit/a8a2341d0473d1379a3a3d028c2116fbe9776ab0))
- add accounting guide drawer to loyalty view ([`4da6504`](https://github.com/mitienda-pe/mitienda-admin/commit/4da6504d49a58717f13ba1e7e2dd9fb7615eedef))
- add loyalty program management UI ([`704dca1`](https://github.com/mitienda-pe/mitienda-admin/commit/704dca1dc78da74f5fcd10a7a36ad490af3dd2b9))
- add featured image upload to blog posts ([`5500b2f`](https://github.com/mitienda-pe/mitienda-admin/commit/5500b2f280f8cf590441257bb17526ab9b98e355))
- add blog authors UI with dropdown selection in post forms ([`9c0a75d`](https://github.com/mitienda-pe/mitienda-admin/commit/9c0a75d1d46ec8fd66839f1295ab48426d1c9c15))
- add R2 image upload to product tag form ([`a880906`](https://github.com/mitienda-pe/mitienda-admin/commit/a880906e8e6cce8361eaf01aaae4bbd99a5b9ca5))
- add R2 image fields to product types and cleanup formatting ([`ed66ff2`](https://github.com/mitienda-pe/mitienda-admin/commit/ed66ff2c39c174d26e2248f7fec25585d16fa3aa))
- add button-slide hover effect and stepper preview for product card ([`311979b`](https://github.com/mitienda-pe/mitienda-admin/commit/311979b5112bb8b35f5698b31a121b9e6ad23ed5))
- move Plantilla and Bloques de Plantilla to Apariencia menu ([`cb59f33`](https://github.com/mitienda-pe/mitienda-admin/commit/cb59f3301d4d8f663eff48aa223ddfe6d2b39e67))
- add create block flow to content/components module ([`b6435f3`](https://github.com/mitienda-pe/mitienda-admin/commit/b6435f3830eae2ea1b8f2b6e30ce414232a59bcb))
- add predefined blocks drag-and-drop to template builder ([`ea96c87`](https://github.com/mitienda-pe/mitienda-admin/commit/ea96c87dfd8250a198904f6f2a004290fadc9729))
- add Plantilla template builder module ([`f815b76`](https://github.com/mitienda-pe/mitienda-admin/commit/f815b7637cbe79feae116126746c13c140ee6350))
- add Google Analytics (G-VCXD2NT1LN) ([`7eff3c1`](https://github.com/mitienda-pe/mitienda-admin/commit/7eff3c1afe181d02a8fd245e2fa570ad0c9d099b))
- add magic link auto-login handler (/auth/magic) ([`e7b0d8c`](https://github.com/mitienda-pe/mitienda-admin/commit/e7b0d8c10738f61cbf20aff356f1902d7de8bc8b))
- split Google/SEO into separate views, move Google to integrations module ([`cdc8c33`](https://github.com/mitienda-pe/mitienda-admin/commit/cdc8c339d03b57b552e9332b482a0ca88cdf2e64))
- add TikTok Pixel icon to integration providers listing ([`e6d2a2f`](https://github.com/mitienda-pe/mitienda-admin/commit/e6d2a2f9ceba8d873a0633e7a6d317a9b6a9b148))
- add frontend-only integration providers UI (chat, analytics, push, lead capture) ([`44d050b`](https://github.com/mitienda-pe/mitienda-admin/commit/44d050bdce3ef2d57d8d137a8e4a5f1f6548ae59))

### Correcciones

- use backend webhook_url with secure hash instead of building URL with tienda_id ([`c718f93`](https://github.com/mitienda-pe/mitienda-admin/commit/c718f93a1303a9a4cb8ac3751d95e9977d93f982))
- remove unused computed import in CouponsSection to fix build ([`527545d`](https://github.com/mitienda-pe/mitienda-admin/commit/527545d00e0886562d375e70fd80c19b61c84765))
- rename Powerpay "Client ID" label to "Client Key" to match provider terminology ([`6b03691`](https://github.com/mitienda-pe/mitienda-admin/commit/6b03691baccdd7ca195f7de6788cf5824e6c8cf2))
- migrate promotions-v2 forms to PrimeVue components ([`a1f10d6`](https://github.com/mitienda-pe/mitienda-admin/commit/a1f10d654b505ce2bc86135f1effd15366fa6dca))
- update Powerpay config form with correct credential fields ([`529023e`](https://github.com/mitienda-pe/mitienda-admin/commit/529023ed4f9ac7cf26e25605fc836f3adac6343c))
- watch hasVariantsProp to load variants when product data arrives ([`5e4f7c9`](https://github.com/mitienda-pe/mitienda-admin/commit/5e4f7c98704db94fa64b1ef2ee85a4e2ff709e7f))
- swap card style order — bordered first as default ([`f2e5bf1`](https://github.com/mitienda-pe/mitienda-admin/commit/f2e5bf176943f3aba005668671e41a10fdd84420))
- update Webpay logo SVG ([`e6c071d`](https://github.com/mitienda-pe/mitienda-admin/commit/e6c071d445dd9bbefb681df89c527bebbef6b57d))
- add missing Wompi, dLocal, Flow SVG logo files ([`acbb8f8`](https://github.com/mitienda-pe/mitienda-admin/commit/acbb8f856221152be6544732431d0d3d75034b6d))
- add Webpay, Wompi, dLocal, Flow logos to gateway map ([`b520ac0`](https://github.com/mitienda-pe/mitienda-admin/commit/b520ac02f5a9a4532667bdfe06ad923db2f1998e))
- resolve TS2339 type error in payment-gateways store ([`4ef6454`](https://github.com/mitienda-pe/mitienda-admin/commit/4ef6454b7fcb0b3a9db5d58d5ff9d38578b4c2e5))
- align DispatchDetailView with actual API response structure ([`03dc829`](https://github.com/mitienda-pe/mitienda-admin/commit/03dc8293c5d48259b0588cfa4d839c717f65c261))
- use response.success instead of response.error in dispatch views ([`05ff8e2`](https://github.com/mitienda-pe/mitienda-admin/commit/05ff8e2e137ef7a1a5399bbe08acb7032b8c6f2e))
- check dispatch enabled before showing loading spinner ([`c9b2c02`](https://github.com/mitienda-pe/mitienda-admin/commit/c9b2c02d9acaa97b7a5efacacccf8b7d06ca1760))
- resolve TypeScript build errors in FulfillmentWmsView and OrderDetailView ([`c87b0b6`](https://github.com/mitienda-pe/mitienda-admin/commit/c87b0b6c7619ffd1d4cb332a46c007e9e4148ed7))
- use openExternal helper instead of window.open in templates ([`508f4f6`](https://github.com/mitienda-pe/mitienda-admin/commit/508f4f648060be1feebcf194060228fef4544c30))
- strip YAML frontmatter from help docs before rendering ([`b1b51fc`](https://github.com/mitienda-pe/mitienda-admin/commit/b1b51fc96003e020b218d0f9d13ea89d2ead542a))
- clean up orphaned PrimeVue overlay masks on route navigation ([`4356d4a`](https://github.com/mitienda-pe/mitienda-admin/commit/4356d4a1c48ae38c08cbbeec0a5cdc63cd9ff2df))
- remove color options from create dialog, add in detail view only ([`250a53e`](https://github.com/mitienda-pe/mitienda-admin/commit/250a53e8858d7eb5c96781eff55bc8626b9fdd53))
- payment gateways and couriers show only Activo or Sin configurar ([`ac282ee`](https://github.com/mitienda-pe/mitienda-admin/commit/ac282eed9ed13fe42d208bab32528abbd06c957f))
- simplify QuillEditor v-model sync — use source='user' filter instead of isInternalChange flag ([`9049e10`](https://github.com/mitienda-pe/mitienda-admin/commit/9049e1099a442a321ec87d1f9fba4155d542e91d))
- preserve editor content when saving blog post settings ([`7499690`](https://github.com/mitienda-pe/mitienda-admin/commit/74996901d91cf100c80c692efc34576c4ad7673e))
- correct uploadImage response type from image_url to imagen_url ([`26942bb`](https://github.com/mitienda-pe/mitienda-admin/commit/26942bb48c176126b91feb8cb54dab5366a231c9))
- align menu action buttons and make them always visible ([`5637517`](https://github.com/mitienda-pe/mitienda-admin/commit/56375172d5362b195837e834ea3fcca1aebc5a41))
- sticky sidebar with independent scroll and scroll-to-top on navigation ([`71eafd1`](https://github.com/mitienda-pe/mitienda-admin/commit/71eafd1fe5b2a8c99161ae587982fe7a93342613))
- add cache delay notice to appearance save toasts ([`9694cf8`](https://github.com/mitienda-pe/mitienda-admin/commit/9694cf8dfe2521da7e860325b96db61d4d74f2ef))
- update help drawer route mappings for new docs structure ([`f3742a4`](https://github.com/mitienda-pe/mitienda-admin/commit/f3742a48583fe766554d599a490bc530430ba78a))
- reorder integration provider categories ([`3057ecc`](https://github.com/mitienda-pe/mitienda-admin/commit/3057ecc4e933ca2e5c100ae06ba651e131ba009c))
- remove Facebook and TikTok from Tu Tienda sidebar menu ([`9fb05bc`](https://github.com/mitienda-pe/mitienda-admin/commit/9fb05bcddfd7b762d49fbb4cb16b01ccf76316db))
- remove SUMO and getbrave icons (duplicates/invalid) ([`9760598`](https://github.com/mitienda-pe/mitienda-admin/commit/9760598b72514d37b715309eebdbdeb29e00c418))

### Refactor

- normalize gateway logo filenames + cleanup PNG duplicates ([`320cefc`](https://github.com/mitienda-pe/mitienda-admin/commit/320cefcee78eb150f862ed4f65f2c3554194e5ae))
- use SVG logos for Izipay, Openpay, PowerPay + add Yape/Plin logos ([`62e1b07`](https://github.com/mitienda-pe/mitienda-admin/commit/62e1b07431669f41f188c2a812483db876bf6bea))
- merge Monitor and Registro de Eventos into single dashboard view ([`a160ab9`](https://github.com/mitienda-pe/mitienda-admin/commit/a160ab9ebd158c926192c36951eb26d1466c3966))

## Febrero 2026

### Novedades

- add driver.js onboarding tours and setup checklist ([`1034e67`](https://github.com/mitienda-pe/mitienda-admin/commit/1034e67bc689caa7e8bfce6cf5252fe388887280))
- add contextual HelpDrawer with CDN-sourced markdown docs ([`68abc0b`](https://github.com/mitienda-pe/mitienda-admin/commit/68abc0b3a10d07346d2199eb58bfde3d9946938c))
- add bulk product linking to product tags module ([`8f19d59`](https://github.com/mitienda-pe/mitienda-admin/commit/8f19d594a93b75511927d9810ca135507104014b))
- add subscription status module with plan info, quotas, and history ([`6540890`](https://github.com/mitienda-pe/mitienda-admin/commit/65408906ab8b09c121207c888d50cef947b79701))
- add plan-based user limits and module gating for store users ([`b4d4e4b`](https://github.com/mitienda-pe/mitienda-admin/commit/b4d4e4b751d49b0fdc053890a85d43d95b127312))
- add store users management module ([`34beed1`](https://github.com/mitienda-pe/mitienda-admin/commit/34beed15ab41a19e55e409eb24d24b2dacfef144))
- colored lock icons in sidebar, upgrade pill in modal, and plan store tests ([`0d4f25f`](https://github.com/mitienda-pe/mitienda-admin/commit/0d4f25f4c6d1d9fbf10e72ca1155d96f5d654d40))
- show upgrade modal on 403 module access errors from API ([`6c19e67`](https://github.com/mitienda-pe/mitienda-admin/commit/6c19e67e97f3c26cdd9d59b6b611cda39b99e990))
- handle server-side quota errors and refresh plan data ([`1501796`](https://github.com/mitienda-pe/mitienda-admin/commit/1501796ec88d9c3b3aab950ac94d99a4fff454b5))
- refactor queue view to generic multi-type job monitor ([`e8f313b`](https://github.com/mitienda-pe/mitienda-admin/commit/e8f313b5354149d5f29e389551022ab92525dddb))
- add plan-based access control with sidebar locks and upgrade modal ([`c15fd6d`](https://github.com/mitienda-pe/mitienda-admin/commit/c15fd6d83ec746e25adb449ce481f86bbbb20e5d))
- add plan store, types, API client, and module-route config ([`606148b`](https://github.com/mitienda-pe/mitienda-admin/commit/606148b86415b56b369c826a4e561023c7e1fb3b))
- add cart.abandoned event label to integration provider config ([`454ec25`](https://github.com/mitienda-pe/mitienda-admin/commit/454ec251a819e96f91f060eb9c60dafd4a575fd1))
- add EIP Phase 3 monitoring dashboard and dead letter support ([`cd6126b`](https://github.com/mitienda-pe/mitienda-admin/commit/cd6126b3deea5198e7fd12b49dfdfd827569b4ed))
- add integration providers frontend for EIP Phase 2 ([`dd04af2`](https://github.com/mitienda-pe/mitienda-admin/commit/dd04af218c84ab4676895b10e02673f9dbf62139))
- add webhook subscriptions and events log UI for EIP Phase 1 ([`22b0ce3`](https://github.com/mitienda-pe/mitienda-admin/commit/22b0ce301c05c5c1d416d182e5fcac5e457673cd))
- add promotions v2 frontend module with rules-based UI ([`56e7a8d`](https://github.com/mitienda-pe/mitienda-admin/commit/56e7a8dd877d9e365ba01a4aa4dcaaa9eb373aee))
- add bulk product import/edit via CSV upload ([`96b5ebd`](https://github.com/mitienda-pe/mitienda-admin/commit/96b5ebd5741e69dc1d3144d4f86d54ae87a42bb7))
- activate color swatches and size buttons toggles in product card config ([`a8e4e1c`](https://github.com/mitienda-pe/mitienda-admin/commit/a8e4e1c916350e4ec502a9de2a2ceacd22053af9))
- add image picker to variant table for linking product images to variants ([`3484455`](https://github.com/mitienda-pe/mitienda-admin/commit/3484455ce1f2c32fb90c9185f24964eb3cf2b97c))
- add attribute management and product variant editor ([`29c0acd`](https://github.com/mitienda-pe/mitienda-admin/commit/29c0acdd2c6bfdea77047de9a450f0fca01398d0))
- display payment rejection reasons in order detail view ([`a783204`](https://github.com/mitienda-pe/mitienda-admin/commit/a7832046283f069007a8bd4f0a9c121eaf92d314))
- integrate AI text enhancer across product and legal pages ([`5481478`](https://github.com/mitienda-pe/mitienda-admin/commit/54814781314370c3cbbdbdae86cab6be94839cf5))
- migrate from TinyMCE to Quill 2.x WYSIWYG editor ([`2c618bd`](https://github.com/mitienda-pe/mitienda-admin/commit/2c618bd82d3391083e17788553f846e6de915137))
- change product permalink URL from /checkout to /compra ([`1e156f6`](https://github.com/mitienda-pe/mitienda-admin/commit/1e156f63a347ece4b80eb037972e6fd808cb8dff))
- product form improvements — SEO, dimensions, external categories, shipping ([`193bada`](https://github.com/mitienda-pe/mitienda-admin/commit/193bada4ad00501b58d3800ba0c7ca952d4e4817))
- add 'Calcular faltantes' button to bulk-calculate missing IGV prices ([`b588f34`](https://github.com/mitienda-pe/mitienda-admin/commit/b588f3450d68649f567e445bf4571601e5804217))
- add product management views (prices, stock, order) with inline editing and CSV ([`016f5e2`](https://github.com/mitienda-pe/mitienda-admin/commit/016f5e2d4bb00a15f23bd42fb8029766c6ed69e5))
- add legacy HTML components maintenance module (hidden route) ([`cec72f4`](https://github.com/mitienda-pe/mitienda-admin/commit/cec72f48b5a00c51bfac3761f85b80dce478003e))
- add image management (square, cover, OG) to categories, brands and gammas ([`23924d0`](https://github.com/mitienda-pe/mitienda-admin/commit/23924d0f146e920672dfd4a03430f9a1675985da))
- add logo position setting to catalog preferences ([`e313151`](https://github.com/mitienda-pe/mitienda-admin/commit/e313151d2590dc373972eff9ee490540cf62e6af))
- add product ordering and hide out-of-stock settings to catalog config ([`63d3872`](https://github.com/mitienda-pe/mitienda-admin/commit/63d38721aefb56b15aceb7539ef945b194768753))
- add catalog config view under Catálogo menu ([`b6d0978`](https://github.com/mitienda-pe/mitienda-admin/commit/b6d0978b0895ba8d3d94bbe6742fc9c1908bbde5))
- add carousel management module for homepage hero banners ([`a617474`](https://github.com/mitienda-pe/mitienda-admin/commit/a617474cc5830bacd81d06f14f74035eaabe1e8a))
- show customer wishlist in customer detail view ([`9e8a7ca`](https://github.com/mitienda-pe/mitienda-admin/commit/9e8a7cad5b6334b7eb7c01866a1bd8cec3d9ea8f))
- add SEO, Facebook, and TikTok store modules with supporting files ([`546d8d0`](https://github.com/mitienda-pe/mitienda-admin/commit/546d8d0a82853b0a1411941e64a8ecd7791f7c9d))
- add carousel and thumbnails image display modes ([`ef962bf`](https://github.com/mitienda-pe/mitienda-admin/commit/ef962bf0e684b2be92327bc5680da7173aeec248))
- add product card appearance configuration module ([`9c09710`](https://github.com/mitienda-pe/mitienda-admin/commit/9c09710c3a3e59e632a893951dbfe1474d6ca7e6))
- add custom domain module with DNS instructions and verification ([`3ff6309`](https://github.com/mitienda-pe/mitienda-admin/commit/3ff6309cfb195577ac8b56fd689adab9eb1ed2cc))
- auto-prompt OneSignal push notifications on login ([`0ce4b9a`](https://github.com/mitienda-pe/mitienda-admin/commit/0ce4b9a49a9a28848d67fa0896a39ba6a9b5a7fd))
- support multiple email notifications as pills ([`f1d07f2`](https://github.com/mitienda-pe/mitienda-admin/commit/f1d07f29328530e0e8047e421d95cf61ecdc337a))
- add notifications module with email, web push, and mobile app sections ([`34cc64d`](https://github.com/mitienda-pe/mitienda-admin/commit/34cc64d15a304a80b21d0fce468014c65f500b51))
- implement password reset via email link in profile and login ([`1dae110`](https://github.com/mitienda-pe/mitienda-admin/commit/1dae110b302b4cdc0f8abe082e99e67364361b2a))
- add notification badges to Ventas sidebar menu ([`eb3c28c`](https://github.com/mitienda-pe/mitienda-admin/commit/eb3c28c35504edcce46e3fc7d5a1b4063b4aca42))
- replace text inputs with cascading UBIGEO dropdowns in address dialog ([`eb2eaa2`](https://github.com/mitienda-pe/mitienda-admin/commit/eb2eaa27724acdf690230a0443c6216180b8dd06))
- show contact name field for RUC customers ([`5e24a3e`](https://github.com/mitienda-pe/mitienda-admin/commit/5e24a3eb0cc9008c003364fdabe2c745c66cc80c))
- add customer create/edit forms and address management ([`1c800b5`](https://github.com/mitienda-pe/mitienda-admin/commit/1c800b5176f80a57315f164a95b99886258ea918))
- show customer addresses, clickable email and WhatsApp links ([`8d1b68b`](https://github.com/mitienda-pe/mitienda-admin/commit/8d1b68b22cd788f336251ec4a1a336a8a040ae49))
- add analytical dashboard with ECharts, scorecards, trends, and rankings ([`b1494e4`](https://github.com/mitienda-pe/mitienda-admin/commit/b1494e4b1aa3173ccbc083bbd225e6b72818da23))
- add shipping configuration module (Reparto > Configuración) ([`9ace92f`](https://github.com/mitienda-pe/mitienda-admin/commit/9ace92ff06b9b63d37f93aa05abe62aa55c53e50))
- use TinyMCE WYSIWYG editor for store messages ([`4101001`](https://github.com/mitienda-pe/mitienda-admin/commit/41010017e430d9da8120329be8ff68bc86a6e403))
- add store configuration and messages modules ([`c05b337`](https://github.com/mitienda-pe/mitienda-admin/commit/c05b337f328d233dc9639767391dcf2b98cf50f9))
- add catalog preferences to appearance config page ([`95dc3df`](https://github.com/mitienda-pe/mitienda-admin/commit/95dc3df1802e5436893ddb37536a36adabbd3649))
- add appearance config module with logo/favicon upload (SVG support) ([`f554ac8`](https://github.com/mitienda-pe/mitienda-admin/commit/f554ac8149034a62a9673ef99bc839f2e887bef0))
- add typography/font pairing module (Apariencia > Tipografía) ([`da8b2c8`](https://github.com/mitienda-pe/mitienda-admin/commit/da8b2c8ff405fd519b45d8fb70d11394b1aecf29))
- add store colors module (Apariencia > Colores) ([`9f81415`](https://github.com/mitienda-pe/mitienda-admin/commit/9f814157bdf5589085061ef4ad43661724fc0227))
- split blog into blog category and blog post link types ([`9519fe0`](https://github.com/mitienda-pe/mitienda-admin/commit/9519fe02a5863e2e12bd3d5a343b98fba731c278))
- add navigation menu module (Apariencia > Menú) ([`a179db9`](https://github.com/mitienda-pe/mitienda-admin/commit/a179db93e35d506a45091cab8ebbefe0eb03df62))
- add complaints (libro de reclamaciones) module with list and detail views ([`5e8296e`](https://github.com/mitienda-pe/mitienda-admin/commit/5e8296ed1cbb02f335e6bd0205dc9b994431f57d))
- add product reviews module with moderation UI and integrations ([`f384a6a`](https://github.com/mitienda-pe/mitienda-admin/commit/f384a6ad3b1c89eae9bc8924b275cc7075c5b2c9))
- add sorting, filters and order stats to customers list ([`1d770ec`](https://github.com/mitienda-pe/mitienda-admin/commit/1d770ec87299058fea7d077422f6857f80d1cfd5))
- simplify customers view with DataTable and order stats ([`18b102a`](https://github.com/mitienda-pe/mitienda-admin/commit/18b102a3e98d3292505cf844ad384eb743b61384))
- add shipping reference, coupon details, and referrer to order detail ([`8b04af2`](https://github.com/mitienda-pe/mitienda-admin/commit/8b04af2b56fc72fde7bd39047ae8fff44fd0d8ef))
- enhance shipping labels with complete sender info ([`9b7ee3d`](https://github.com/mitienda-pe/mitienda-admin/commit/9b7ee3d6a1cecd71403825d86b47b17a2d298aa1))
- add order download options (PDF, CSV, Ticket, Picking List) ([`b3495a0`](https://github.com/mitienda-pe/mitienda-admin/commit/b3495a0578751928e1b1431a60664e8b2c685df2))
- add select all/deselect all to ProductLinkDialog ([`e2ff00e`](https://github.com/mitienda-pe/mitienda-admin/commit/e2ff00e5acdb74b32ce1344eee1a907575aa765c))
- add Upsales and Combos frontend modules ([`3c8c80d`](https://github.com/mitienda-pe/mitienda-admin/commit/3c8c80d71d7950b963ca7ea457e9efabb336564d))
- add Referidos (Referral Codes) module to Marketing section ([`70e7a76`](https://github.com/mitienda-pe/mitienda-admin/commit/70e7a76b30d82db1471bceb9838e73995e3623a2))
- add Tu Tienda module with store info and addresses management ([`67bb3a0`](https://github.com/mitienda-pe/mitienda-admin/commit/67bb3a0c40476768a0ef3f824e03d8f398b90342))
- add auto-emission toggle to Nubefact configuration ([`2e198f3`](https://github.com/mitienda-pe/mitienda-admin/commit/2e198f3561d16800fbdb532e829f51b7703561c3))
- add product linking and counts to Brands and Categories views ([`ef818b4`](https://github.com/mitienda-pe/mitienda-admin/commit/ef818b45d5b5c258151a62b207e90998345751e4))
- add delegate_billing toggle to NetSuite configuration ([`4e990cc`](https://github.com/mitienda-pe/mitienda-admin/commit/4e990ccb626d41058937b8ba0229ba8085c7fbd8))
- show NetSuite document number in order detail ([`92f28ea`](https://github.com/mitienda-pe/mitienda-admin/commit/92f28eabcfb8652d1c3cf0a80191229e1a8e48db))
- add Product Lists module to backoffice ([`ebbbf30`](https://github.com/mitienda-pe/mitienda-admin/commit/ebbbf3089b4922beb7b287254fdd21133a300321))
- add product linking to gammas module ([`df6eae1`](https://github.com/mitienda-pe/mitienda-admin/commit/df6eae1acd8c2a49d51b8ea5d1110cb833419e7e))
- change categories view from cards to expandable tree structure ([`9c89b18`](https://github.com/mitienda-pe/mitienda-admin/commit/9c89b183dd55d236f47e85956ae2b4199efb6ff3))
- integrate MTBuilder as Visual Builder and standardize PrimeVue icons ([`4a68bda`](https://github.com/mitienda-pe/mitienda-admin/commit/4a68bda6ab1834c0d56483487f0b52826b2d56f1))
- add manual billing document emission UI ([`08e54d8`](https://github.com/mitienda-pe/mitienda-admin/commit/08e54d82d5c82689c8abbd4028d67ca08ef90307))
- production readiness improvements ([`47486c1`](https://github.com/mitienda-pe/mitienda-admin/commit/47486c1bb2be3a364f54b5d51f372a01a8e3a3cc))

### Correcciones

- prevent double confirm dialog on queue job delete/retry ([`1f9a903`](https://github.com/mitienda-pe/mitienda-admin/commit/1f9a903ff3f0ffeb8e2b1aa8b1a31209aa83d9d4))
- prevent test credentials from leaking to production login form ([`c36af52`](https://github.com/mitienda-pe/mitienda-admin/commit/c36af525892abf0cf256157529442e7aa45deb36))
- store-users UI improvements - owner-only actions and clean modules endpoint ([`7e1dc2b`](https://github.com/mitienda-pe/mitienda-admin/commit/7e1dc2baef9baf5d07b3abced93ee54f9378584e))
- add Tailwind safelist for dynamic plan lock/pill color classes ([`2ddcfed`](https://github.com/mitienda-pe/mitienda-admin/commit/2ddcfed89d6694099fa0a736a199d89676a961cc))
- await plan fetch before route access check to prevent race condition ([`7784678`](https://github.com/mitienda-pe/mitienda-admin/commit/778467897609669d8cffeca5b0cdf7a5c4200d3c))
- show all products by default instead of only published ones ([`840e91c`](https://github.com/mitienda-pe/mitienda-admin/commit/840e91cea5f0f2fa25d575d19cab00624f497c1e))
- use npm registry for ai-text-enhancer instead of local file path ([`4c4adef`](https://github.com/mitienda-pe/mitienda-admin/commit/4c4adef8ef2a89b861261a168c24f3343ce38aae))
- auto-expand variant rows in Prices and Stock views ([`5a8bb23`](https://github.com/mitienda-pe/mitienda-admin/commit/5a8bb234eb4990d5985370428075dbdfa80a01fe))
- DataTable variant expansion in Prices and Stock views ([`25cb911`](https://github.com/mitienda-pe/mitienda-admin/commit/25cb911ee1df5ecff119beba4ade888acab5366c))
- replace PrimeVue expander column with manual toggle for variants ([`0d254c6`](https://github.com/mitienda-pe/mitienda-admin/commit/0d254c6d10ced9d7a7328301130664f504dfe5a1))
- update CSV import dialog for ID-based variant matching ([`0a6c131`](https://github.com/mitienda-pe/mitienda-admin/commit/0a6c13183ee6e7c46a225eed3b46420f621bc841))
- wrap product thumbnails in aspect-square div for 1:1 ratio ([`a7923d3`](https://github.com/mitienda-pe/mitienda-admin/commit/a7923d38921f827b06be86bf67daa38eb0710a4c))
- merge catalog preferences with defaults to handle missing fields ([`53bb906`](https://github.com/mitienda-pe/mitienda-admin/commit/53bb9061305bb256947957743b250c7caab40139))
- resolve Monaco editor not loading in component edit view ([`d18d3e8`](https://github.com/mitienda-pe/mitienda-admin/commit/d18d3e831dab00636c8152cf6ffdbdf7f614776c))
- increase Node heap size for vite build (Monaco OOM) ([`87328c3`](https://github.com/mitienda-pe/mitienda-admin/commit/87328c33764ca36c18f13b0757bfdb036f6c2a3f))
- ensure 4 rounded corners on image for border-image and shadow styles ([`9f37c98`](https://github.com/mitienda-pe/mitienda-admin/commit/9f37c982784c750a15d7a37f6abed7531eaf6c71))
- rename cancellation_rate to rejection_rate in dashboard ([`0e6ad0f`](https://github.com/mitienda-pe/mitienda-admin/commit/0e6ad0fed79a5cf295b431d2a7ff86805f481377))
- customer detail API response parsing ([`2c68f27`](https://github.com/mitienda-pe/mitienda-admin/commit/2c68f274a7046338af0ece3d66c432f9162963e8))
- configure Monaco Editor web workers for production builds ([`950bbb0`](https://github.com/mitienda-pe/mitienda-admin/commit/950bbb02cd000038d0d4187d5ac94b8e99c22f90))
- copy MTBuilder locale files to public for production i18n ([`630d969`](https://github.com/mitienda-pe/mitienda-admin/commit/630d96965826d567cb36cc4a84a85fc908fecdd6))
- patch MTBuilder normalizedLocale bug for production builds ([`ac3cf88`](https://github.com/mitienda-pe/mitienda-admin/commit/ac3cf88ad3f0624d80fe46f77ecb7e2200d2b3e7))
- install and enable MTBuilder package for production builds ([`b85d41c`](https://github.com/mitienda-pe/mitienda-admin/commit/b85d41cd52a1839cda255885866ce59180053106))
- connect shipping locations to real ubigeo API for all countries ([`2c923c3`](https://github.com/mitienda-pe/mitienda-admin/commit/2c923c3d8c785096de9ff170ed82441424685d9d))
- use Lucide shopping-basket SVG for basket cart icon ([`89e3d45`](https://github.com/mitienda-pe/mitienda-admin/commit/89e3d451cac99f4f0936d3d5460603250246616f))
- use valid PrimeIcons v7 icons for sidebar (palette, language) ([`3322b7e`](https://github.com/mitienda-pe/mitienda-admin/commit/3322b7e91d3065d6e57b0e088f738d3c1cd1e1b8))
- update sidebar icons for Colores and Tipografía ([`04b3900`](https://github.com/mitienda-pe/mitienda-admin/commit/04b39009b833febf0471582a660aaa6b1ecc7a66))
- default auto-emission toggle to OFF for new tenants ([`71df78a`](https://github.com/mitienda-pe/mitienda-admin/commit/71df78ae0a1e25173cee8f0c6fda05bde59ede3f))
- invert auto-emission toggle to positive UX (on = emit, off = don't emit) ([`b519fa7`](https://github.com/mitienda-pe/mitienda-admin/commit/b519fa7e224a73c0a85eab0fbbf6c43cd86742d0))
- add global DataTable styles for consistent padding/spacing ([`e1162b2`](https://github.com/mitienda-pe/mitienda-admin/commit/e1162b2d52f70c6abcd9541e201a6aaa3935da84))
- make brandApi.getAll() handle wrapped response format ([`b3fda9d`](https://github.com/mitienda-pe/mitienda-admin/commit/b3fda9d66a5ef46f4cfb91a2f90a35bc26659aa7))
- exclude null parent_id when creating root categories ([`7df556c`](https://github.com/mitienda-pe/mitienda-admin/commit/7df556c09c2587dd9fa3972cbfeba9ac7b809006))

### Rendimiento

- remove Total Gastado column from customer list ([`8115baa`](https://github.com/mitienda-pe/mitienda-admin/commit/8115baac0250a3fffebed879deeeffc539bba731))

### Refactor

- simplify product card options and improve preview ([`176c969`](https://github.com/mitienda-pe/mitienda-admin/commit/176c9699548c7a6f1ec3f668d4d6624bddd23a5c))

## Enero 2026

### Novedades

- add HOP Envíos courier provider config view and types ([`1e42d37`](https://github.com/mitienda-pe/mitienda-admin/commit/1e42d3720189296bab59dde7d2cd995ccac24cd0))
- add Urbano and Yango Delivery courier config views ([`afb4916`](https://github.com/mitienda-pe/mitienda-admin/commit/afb49163f38ac9257a5d88ce0bdc0c15dff0202b))
- add Chazki and Nirex courier provider config views ([`bed0903`](https://github.com/mitienda-pe/mitienda-admin/commit/bed090373a4ade167eab1d2ea128ea9057798404))
- add courier logos, card redesign, and 99min API v3 support ([`78ca2d1`](https://github.com/mitienda-pe/mitienda-admin/commit/78ca2d19835171a0b18e1adf31b88b77a4360d42))
- add courier providers module with config views and price simulator ([`2d094fb`](https://github.com/mitienda-pe/mitienda-admin/commit/2d094fbb96a77656bc4a8ff01baab4773edc1e63))
- add Shipping Zones module and Reparto sidebar group ([`d974665`](https://github.com/mitienda-pe/mitienda-admin/commit/d9746654bb50b3a57d231a5e275fc2ec7fa2da00))
- add Legal Pages frontend module ([`300392d`](https://github.com/mitienda-pe/mitienda-admin/commit/300392d7900dd491b060f4214b43a1044b03cd29))
- add customer category ID field to NetSuite credentials form ([`fbbb71c`](https://github.com/mitienda-pe/mitienda-admin/commit/fbbb71c8f5a8a11a7691179b337e8706673890dc))
- add R2 CDN image support to gallery ([`2d0a25f`](https://github.com/mitienda-pe/mitienda-admin/commit/2d0a25f1a839096d9a44cc1fca3a3aeb211b21c6))
- add Image Gallery view with detail dialog and metadata editing ([`872a38b`](https://github.com/mitienda-pe/mitienda-admin/commit/872a38b5b0bf67a5ecd3d6bc91e131bee6551245))
- add Blog module with posts, categories, and content editors ([`de7b109`](https://github.com/mitienda-pe/mitienda-admin/commit/de7b109c2b6594e49bd2457675d5c75ddacda8ff))
- add page preview view, use InputSwitch toggle for publish state ([`933de7e`](https://github.com/mitienda-pe/mitienda-admin/commit/933de7e4144b7f914f3c097b1aa97e06c70e5f56))
- add Pages module with WYSIWYG and Code editor support ([`228f8ff`](https://github.com/mitienda-pe/mitienda-admin/commit/228f8ff2bed75d06d2f20293d86ad726fed56497))
- add Price Level ID field to NetSuite configuration form ([`3d68159`](https://github.com/mitienda-pe/mitienda-admin/commit/3d68159ab08495f131433690717fb3ff7865407d))
- add promotions report view with filters and export ([`a730095`](https://github.com/mitienda-pe/mitienda-admin/commit/a730095b601ebd9c4c06cb6aba25d9897539bf1b))
- add product catalog report view with CSV/XLSX export ([`9177817`](https://github.com/mitienda-pe/mitienda-admin/commit/9177817afd1410a5dc8d99983fa4eda42ed67b8a))
- add NetSuite stock validation toggle in config UI ([`ca1059a`](https://github.com/mitienda-pe/mitienda-admin/commit/ca1059a6be0fc5bb9db38439e95f5b802f3cfa8a))
- add individual stock query button for products without data ([`5342eea`](https://github.com/mitienda-pe/mitienda-admin/commit/5342eead3e2e72350c858cdf8220357c2c608a4b))
- add Stock link to NetSuite sidebar menu ([`8304596`](https://github.com/mitienda-pe/mitienda-admin/commit/83045963f33a353993b055494aea3616f72b5435))
- add NetSuite stock query view ([`f64c376`](https://github.com/mitienda-pe/mitienda-admin/commit/f64c376550868220c46402b416f2ce481bb92686))
- show original price and discount percent in order detail ([`4ca2f2e`](https://github.com/mitienda-pe/mitienda-admin/commit/4ca2f2e444043239574168014093e68182c2c5c4))
- add Gammas module and improve catalog form views ([`879f75b`](https://github.com/mitienda-pe/mitienda-admin/commit/879f75bf13f1bd8cf68e1138f4e2bfefb5eaff8d))
- display warning when social account linking fails ([`c6fbbd0`](https://github.com/mitienda-pe/mitienda-admin/commit/c6fbbd088298925cd2789262cb01c234cd30c134))
- add user profile module with social login ([`dba5cec`](https://github.com/mitienda-pe/mitienda-admin/commit/dba5cececf730a3e87629ca071c7d8c1fd3ea024))
- improve NetSuite sync UI with promotions section ([`757471d`](https://github.com/mitienda-pe/mitienda-admin/commit/757471dcc77fe57e176d61e0e3f4eca6a7646882))
- **orders:** add NetSuite payment debug button in ERP sync section ([`6965714`](https://github.com/mitienda-pe/mitienda-admin/commit/69657145fc062762214548ad982ad64a52a11101))

### Correcciones

- resolve TypeScript build errors in courier config views ([`a07feae`](https://github.com/mitienda-pe/mitienda-admin/commit/a07feae0d91756bb9a70784577f3898b08cf8abd))
- use brand colors for Yango and HOP card headers, white Yango logo ([`fd720f5`](https://github.com/mitienda-pe/mitienda-admin/commit/fd720f5fd21d85a755729a8c80261a43f2233933))
- use Chazki webp logo instead of png ([`591764a`](https://github.com/mitienda-pe/mitienda-admin/commit/591764adce3a48d5708cdae31c1c624277c1d649))
- use Nirex PNG logo instead of SVG placeholder ([`d80f25c`](https://github.com/mitienda-pe/mitienda-admin/commit/d80f25c07a4f8b60a43e9d8c1f994ced07344471))
- remove hardcoded default values from NetSuite credentials form ([`e82d172`](https://github.com/mitienda-pe/mitienda-admin/commit/e82d172a6ad25722926c8f3b2af7f0eb95e05ec3))
- remove unused imports to fix TypeScript build errors ([`9a4b473`](https://github.com/mitienda-pe/mitienda-admin/commit/9a4b473eb8e17d1c22a2c831f6a8c877a6d11517))
- use path-based route for product links in image detail dialog ([`f71c318`](https://github.com/mitienda-pe/mitienda-admin/commit/f71c31842dbf1240e132cca245a4cd06c16d5414))
- use Dropdown instead of Select for PrimeVue compatibility ([`20b2bb9`](https://github.com/mitienda-pe/mitienda-admin/commit/20b2bb9373b45e22633e4d2a8553e71ed0da2a4f))
- correct statusVariant return type for AppBadge variant prop ([`cd6eccd`](https://github.com/mitienda-pe/mitienda-admin/commit/cd6eccd7ec7850fc74b2bbc6c371027332620eb5))
- make product catalog report load all products on mount ([`e37fb18`](https://github.com/mitienda-pe/mitienda-admin/commit/e37fb186ed321d4671781afd57f7ddb402b1f790))
- resolve TypeScript errors in ProductCatalogReportView ([`f161b7c`](https://github.com/mitienda-pe/mitienda-admin/commit/f161b7c867be83ead60d73214eddc87abe2a35e4))
- correct TypeScript types for getNetsuiteStockList ([`3e4b998`](https://github.com/mitienda-pe/mitienda-admin/commit/3e4b998d17929669792d1896851e2a8c722c981d))
- show unit prices with 2-3 decimals instead of always 2 ([`f52794c`](https://github.com/mitienda-pe/mitienda-admin/commit/f52794c94da0c89aeffd1f7ba63654fc9b4f7c6f))
- use apiClient instead of axios for authenticated API calls ([`36b837d`](https://github.com/mitienda-pe/mitienda-admin/commit/36b837d36c816a70e230ecdde3478a11220463d5))
- add missing PrimeVue component imports in NetsuitePriceSync ([`67be473`](https://github.com/mitienda-pe/mitienda-admin/commit/67be4736e6e765580d2f0d7567a8b760276f3eeb))
- product quantity save button and original value tracking ([`0313e28`](https://github.com/mitienda-pe/mitienda-admin/commit/0313e2842951b2f17fce417092aebfde898b3566))
- remove unused computed variable to fix TypeScript build ([`4841030`](https://github.com/mitienda-pe/mitienda-admin/commit/4841030f9dd341d24ef8fec71cb40232f35b4b6c))
- resolve TypeScript build errors ([`f6cb5e8`](https://github.com/mitienda-pe/mitienda-admin/commit/f6cb5e86ef31b7a9d8976549f35a75c6dee67901))
- downgrade @types/node to fix TypeScript build error ([`0302e57`](https://github.com/mitienda-pe/mitienda-admin/commit/0302e57d109aaef9d959612de15e2066af2adba5))

## Diciembre 2025

### Novedades

- **pos:** save discount info in order details ([`af69ead`](https://github.com/mitienda-pe/mitienda-admin/commit/af69eadb98b2e1c4861f9e9bda56d424a9103aaf))
- **products:** add ProductPrice component with variant price support ([`7a3290f`](https://github.com/mitienda-pe/mitienda-admin/commit/7a3290f6e4ef14dd85bd656deafb17557d81f62c))
- **reports:** implement orders report module with modern export ([`1e708b7`](https://github.com/mitienda-pe/mitienda-admin/commit/1e708b7ab7703d95464d234acae9c5015c8e232e))
- **nav:** reorganize menu with Sales group ([`541e525`](https://github.com/mitienda-pe/mitienda-admin/commit/541e5253109b824ecb32fcb9fe4455c432c399d4))
- **orders:** display payment date and time ([`81e51d8`](https://github.com/mitienda-pe/mitienda-admin/commit/81e51d8ccca0ada0835da505da6b109789e18cd9))
- **orders:** improve shipping address display format ([`4c6066e`](https://github.com/mitienda-pe/mitienda-admin/commit/4c6066e8d7a7e5245780338b65d3d12037b713b0))
- **orders:** display complete location hierarchy in shipping address ([`cd431a0`](https://github.com/mitienda-pe/mitienda-admin/commit/cd431a03febdbf4fb9544df1a84e99d08046ebd5))
- **orders:** reorganize order detail cards with new structure ([`900f293`](https://github.com/mitienda-pe/mitienda-admin/commit/900f29324bfa9583d11b307f52c0ae4d3d445493))
- **orders:** map product_image field from API ([`dd475e2`](https://github.com/mitienda-pe/mitienda-admin/commit/dd475e221ac1bb6a6c5ff11a813786faa3067619))
- **orders:** add subtotal before order-level promotions ([`92697b5`](https://github.com/mitienda-pe/mitienda-admin/commit/92697b521093dcf8946a61a792dbc9783bce8a69))
- **orders:** move shipping to products table and add IGV breakdown ([`afafb5b`](https://github.com/mitienda-pe/mitienda-admin/commit/afafb5b2ee497cc3f679172b37d38f6d287d1909))
- **orders:** improve discount display and add bonificado badge ([`39bdeb3`](https://github.com/mitienda-pe/mitienda-admin/commit/39bdeb340a3f9b0f6252f0adcd177fa6a3293c7c))
- **orders:** display item-level discounts in product table ([`4f52107`](https://github.com/mitienda-pe/mitienda-admin/commit/4f5210773373acc342d536986852a7a0987a11fc))
- **orders:** display applied promotions in order summary ([`4c83684`](https://github.com/mitienda-pe/mitienda-admin/commit/4c83684778bdc03ffcd0cdcdafe6e0a15185b5d1))
- **orders:** show total payments sum for POS multi-payment orders ([`17301ba`](https://github.com/mitienda-pe/mitienda-admin/commit/17301ba4b4f33dbf6509856c568335a32b5e50fe))
- **fraud:** add fraud risk analysis card to order detail view ([`be1923b`](https://github.com/mitienda-pe/mitienda-admin/commit/be1923b5af62f6bdc57ccabac7e23eb082527ba7))
- **orders:** add OpenStreetMap delivery location map ([`d636a6e`](https://github.com/mitienda-pe/mitienda-admin/commit/d636a6e4685ff556abab9ea25e07706a60654ab2))
- **abandoned-carts:** improve table UX and infinite scroll ([`6c12b77`](https://github.com/mitienda-pe/mitienda-admin/commit/6c12b77063a245e56b8140336e959d8703943875))
- **abandoned-carts:** add menu link to sidebar navigation ([`7077583`](https://github.com/mitienda-pe/mitienda-admin/commit/7077583575e83d7981d3f1e86c39e6261f8f5646))
- **abandoned-carts:** migrate abandoned carts module to new backoffice ([`13af608`](https://github.com/mitienda-pe/mitienda-admin/commit/13af6084d5f2cab2381e11fa296e24d34e825ce9))
- agregar botón guardar en campo cantidad de bonificaciones ([`1eee004`](https://github.com/mitienda-pe/mitienda-admin/commit/1eee0042d83af3aad31cef53acaaaf31a61c268b))
- add generic_customer_id and bonification_item_id to NetSuite config UI ([`d725a5f`](https://github.com/mitienda-pe/mitienda-admin/commit/d725a5f418f516ad6c7f852a746c673754f299b1))
- **orders:** mostrar transacciones NetSuite en detalle de venta ([`a014583`](https://github.com/mitienda-pe/mitienda-admin/commit/a014583b77c12ede575defbbc3eb6f82b0d7cc00))
- display price WITH and WITHOUT IGV in product detail view ([`84f1f97`](https://github.com/mitienda-pe/mitienda-admin/commit/84f1f979f4f981873dc2875aef2568dbff8f7413))
- increase currency precision to 8 decimals ([`c050c20`](https://github.com/mitienda-pe/mitienda-admin/commit/c050c20b56a67b7c6095c1f6fb81badbe811c762))
- **orders:** use new /orders/paginated endpoint with full pagination ([`afc61a6`](https://github.com/mitienda-pe/mitienda-admin/commit/afc61a6e4d1e3180dcc8ed455f322493541cc7bc))

### Correcciones

- **promotions:** improve error handling in CreatePromotionDialog ([`9b495a4`](https://github.com/mitienda-pe/mitienda-admin/commit/9b495a463b15ce520ce9ae9656e340ed9a333390))
- **reports:** pass hasData prop to ExportButton in ProductSalesReportView ([`789f0ef`](https://github.com/mitienda-pe/mitienda-admin/commit/789f0efcebc855951c72fa6d9a510f742c9ae340))
- **reports:** separate local and API filter types for Date handling ([`5d43fac`](https://github.com/mitienda-pe/mitienda-admin/commit/5d43fac96cb0925f107506fc5de2bc8f71628816))
- **reports:** use Date object for Calendar maxDate prop ([`b0cf91a`](https://github.com/mitienda-pe/mitienda-admin/commit/b0cf91a59d7e581320015f0069c6d81d1440bf9c))
- **reports:** correct import path for axios client ([`19242f3`](https://github.com/mitienda-pe/mitienda-admin/commit/19242f309fd16cff294d4caa43b84b727471370b))
- **nav:** use valid PrimeIcon for abandoned carts ([`d398273`](https://github.com/mitienda-pe/mitienda-admin/commit/d398273bc45ff769bbd8d4b6ad13af2a4cd57cec))
- **orders:** remove duplicate gateway code field ([`8dc269f`](https://github.com/mitienda-pe/mitienda-admin/commit/8dc269f98a7d694719913748515e32b2ba8176ef))
- **orders:** remove redundant payment gateway field ([`572e3d6`](https://github.com/mitienda-pe/mitienda-admin/commit/572e3d6c941a379d430334912e09db7dac9bfa29))
- **orders:** render line breaks in gateway code properly ([`c238bf1`](https://github.com/mitienda-pe/mitienda-admin/commit/c238bf1551ec95ab404ba5ac316f6be7600aefe9))
- **orders:** change card grid from 4 to 3 columns for better sizing ([`a22995b`](https://github.com/mitienda-pe/mitienda-admin/commit/a22995bd0cdbba9bc28bbc1e2998ba94811fddb6))
- **orders:** calculate subtotal sin IGV from final total ([`70c356b`](https://github.com/mitienda-pe/mitienda-admin/commit/70c356b292ce168f34606c2eee14d1b57dfe598d))
- **orders:** subtract item discount from valor venta column ([`11ec137`](https://github.com/mitienda-pe/mitienda-admin/commit/11ec13701e1d4052e31129df6adc8c010f598d80))
- **orders:** remove extra closing div tag ([`925b2d3`](https://github.com/mitienda-pe/mitienda-admin/commit/925b2d3507e08e62a97c819e534da43dd5a6b7ea))
- **orders:** map shipping_cost from API root level ([`e640b3b`](https://github.com/mitienda-pe/mitienda-admin/commit/e640b3bc348b750bc5334f398b9ba97c4465940f))
- **fraud:** remove duplicate /api/v1 from fraud-analysis API routes ([`05039f7`](https://github.com/mitienda-pe/mitienda-admin/commit/05039f7059a2deb2a715d071b9d6500aa5835fef))
- **fraud:** add fraud-analysis API module and fix store imports ([`fb18926`](https://github.com/mitienda-pe/mitienda-admin/commit/fb189268559cb498e8952ecc8def035a91e19c4c))
- **promotions:** convert bonification quantities from string to number for InputNumber compatibility ([`171e07f`](https://github.com/mitienda-pe/mitienda-admin/commit/171e07f2a98a2bacc4d003749c615c9bed897941))
- corregir nombre de campo de cantidad en bonificaciones ([`639eb1b`](https://github.com/mitienda-pe/mitienda-admin/commit/639eb1ba5e5f524504352ed5b4cfde7fc0b8c388))
- map tiendaventa_payload_notif_erp from API response to Order object ([`97c1a49`](https://github.com/mitienda-pe/mitienda-admin/commit/97c1a49d7c71b3f51cf77c7c1b4a602a72c3ad00))
- add tiendaventa_payload_notif_erp to Order type definition ([`17eeaeb`](https://github.com/mitienda-pe/mitienda-admin/commit/17eeaeb001edcf1b5071ddcc9e75438886d596a8))
- timezone issue in date formatting for billing documents ([`2df53c3`](https://github.com/mitienda-pe/mitienda-admin/commit/2df53c3830a4c93de66ff4040a7c24937e007cea))
- **orders:** add type assertion for raw backend field tiendaventa_payload_notif_erp ([`77d25ac`](https://github.com/mitienda-pe/mitienda-admin/commit/77d25ac9c23482fac45d1fb99e6f5f7399cc4137))

### Reversiones

- restore 2-decimal currency formatting in backoffice ([`0d72655`](https://github.com/mitienda-pe/mitienda-admin/commit/0d726556831e4af0bff44bc7ed632d2306adedae))

### Refactor

- **nav:** remove unused Mapeo de Inventario module ([`53a5f18`](https://github.com/mitienda-pe/mitienda-admin/commit/53a5f180f8b79fc875676899c4a8c077d0099eaa))
- **nav:** rename Configuration group to NetSuite ([`7242763`](https://github.com/mitienda-pe/mitienda-admin/commit/7242763651ebf5ad0ccb80e24db93dd8d36666dd))
- **orders:** move Observaciones card to full width before risk analysis ([`36872ef`](https://github.com/mitienda-pe/mitienda-admin/commit/36872ef9041563515260d0b0a496e0783efcae64))
- **orders:** convert order totals from divs to HTML table ([`656a1e5`](https://github.com/mitienda-pe/mitienda-admin/commit/656a1e5863ffb0bfdc2b5fa6e5f8868551f8bda1))
- **orders:** convert order items from divs to HTML table ([`d34d8e6`](https://github.com/mitienda-pe/mitienda-admin/commit/d34d8e61bdbdb289ab5823d4d4dec9223e1a14a5))
- **orders:** reorganize order detail view layout ([`ee621b5`](https://github.com/mitienda-pe/mitienda-admin/commit/ee621b5c3324d317f9f8f6ff25cb8f97f2c25f02))

## Noviembre 2025

### Novedades

- **ui:** display prices with 5 decimal precision ([`bdd19cb`](https://github.com/mitienda-pe/mitienda-admin/commit/bdd19cb72c56436a7e9a82618a5e33fb6a3cee82))
- **orders:** display NetSuite request payload in ERP sync card ([`0be0cea`](https://github.com/mitienda-pe/mitienda-admin/commit/0be0ceae0c84665a3c7e50da3d37f73f665804e4))
- **orders:** display POS multiple payment methods in order detail ([`e50c0f9`](https://github.com/mitienda-pe/mitienda-admin/commit/e50c0f9c40c24da8bfc90592db26e78b7c7426a2))
- **backoffice:** mostrar información de redondeo en detalle de orden ([`8f7cafb`](https://github.com/mitienda-pe/mitienda-admin/commit/8f7cafb162c8666181ad60b9c0f0628c5135996d))
- **backoffice:** add bon_formagrupos config to bonification UI ([`6780d5e`](https://github.com/mitienda-pe/mitienda-admin/commit/6780d5e83333d37f0708c708736c4e88e0476135))
- **netsuite:** load locations from new sj_netsuite_locations table via API ([`72a334f`](https://github.com/mitienda-pe/mitienda-admin/commit/72a334f3d6642ca8a7bb94797dc298334a6601dd))
- Implementar módulo de promociones tipo 'Precio Rebajado' ([`6a8e2f3`](https://github.com/mitienda-pe/mitienda-admin/commit/6a8e2f34b016137ed5f07fadd99f0a1c30c73c1b))
- add NetSuite queue management interface ([`c56c4b9`](https://github.com/mitienda-pe/mitienda-admin/commit/c56c4b998c3e63a89679e988cfbf5d139408168c))
- NetSuite stock validation for backoffice ([`8b04b2c`](https://github.com/mitienda-pe/mitienda-admin/commit/8b04b2ca0d64b80672e8eb03f50d194a12077aaa))
- **netsuite:** add support for multiple locations in configuration ([`2ea4fdb`](https://github.com/mitienda-pe/mitienda-admin/commit/2ea4fdb5524c7a1b594674d32fdd9660ce055b95))
- add CSV template for NetSuite inventory numbers bulk upload ([`535933d`](https://github.com/mitienda-pe/mitienda-admin/commit/535933dad5d8ed9d9eab8cc2e88e0299a38a86ce))
- enhance promotions and orders modules with new features ([`0cbfae2`](https://github.com/mitienda-pe/mitienda-admin/commit/0cbfae2984ab7db4d19189f5e730af9b3bac5b11))
- add NetSuite inventory mapping module ([`d62bc71`](https://github.com/mitienda-pe/mitienda-admin/commit/d62bc71e4bbec705cb284709f2663051068a5c9e))
- add billing and ERP notification properties to Order type ([`90ac384`](https://github.com/mitienda-pe/mitienda-admin/commit/90ac384066f835ea0552a765fcc2be02a13086cd))
- **netsuite:** enhance UI/UX and implement series auto-sync ([`5c1897c`](https://github.com/mitienda-pe/mitienda-admin/commit/5c1897c49502f786d1878dd9ff078a2beb4fb94a))
- add activation toggle and edit dialog for promotions ([`1a8e5b5`](https://github.com/mitienda-pe/mitienda-admin/commit/1a8e5b59b7e46d50e37a9560ac5d1836e1bd30d8))
- agregar botón de configuración para bonificaciones en vista de detalle ([`3d01f13`](https://github.com/mitienda-pe/mitienda-admin/commit/3d01f139ebb79b8b28aca0fafbbf48c1fdec4ec4))
- rediseñar ConfigureBonificationView con selector de flechas ([`6d2f87c`](https://github.com/mitienda-pe/mitienda-admin/commit/6d2f87c8cba319ffdfea0b3204ba1e1b4d6e2bd7))
- implementar módulo de promociones con enfoque en bonificaciones ([`303f375`](https://github.com/mitienda-pe/mitienda-admin/commit/303f375bebdc43ff4c89abcc3e8d200fb3f91bf5))

### Correcciones

- **orders:** support both pagination formats (pager and pagination) ([`05f91ed`](https://github.com/mitienda-pe/mitienda-admin/commit/05f91edd8940d9cf7638229dd5117e09bc280c0c))
- **orders:** show payment details for single POS payments ([`55ffb49`](https://github.com/mitienda-pe/mitienda-admin/commit/55ffb4985d68cab45b34f4ed8a47281c85cd020d))
- **netsuite:** correct property name in NetsuiteCredentials component ([`17fc918`](https://github.com/mitienda-pe/mitienda-admin/commit/17fc918914fd4d1cb5819fd55e89b38e337baeb0))
- **backoffice:** extraer rounding_amount y total_after_rounding del backend ([`e6f8c33`](https://github.com/mitienda-pe/mitienda-admin/commit/e6f8c33f9bbbbeace845d1990bd705cab57dce2d))
- add type annotations to error handling in NetsuitePriceSync ([`a50fe8c`](https://github.com/mitienda-pe/mitienda-admin/commit/a50fe8c24e19f7067e77e9d2518ce88bf05392d4))
- add proper TypeScript types to NetsuitePriceSync component ([`094963e`](https://github.com/mitienda-pe/mitienda-admin/commit/094963e3cd096ef04aca30fe07db3298d8e4b6e3))
- add lang='ts' to NetsuitePriceSync script tag ([`98ee8d5`](https://github.com/mitienda-pe/mitienda-admin/commit/98ee8d5ef454e3cd6e8f3f280fbed9119dac8989))
- resolve TypeScript error in promotion value input ([`488d9f1`](https://github.com/mitienda-pe/mitienda-admin/commit/488d9f1c4320334f8620d454ca763fc190a5d4cf))
- **netsuite:** fix TypeScript errors in locations feature ([`e660034`](https://github.com/mitienda-pe/mitienda-admin/commit/e66003448cc6020441b4c7f5279d9a335058de15))
- **billing:** dont send null/empty optional fields to API ([`05b0de0`](https://github.com/mitienda-pe/mitienda-admin/commit/05b0de0e7254e3e661cf1f1f644cbff4948bf6df))
- add explicit type annotation for order computed in OrderDetailView ([`1b2abc4`](https://github.com/mitienda-pe/mitienda-admin/commit/1b2abc435efafd45351521c1d42b0b44ee530049))
- resolve TypeScript errors for Netlify build ([`24a84af`](https://github.com/mitienda-pe/mitienda-admin/commit/24a84af4b7c908e5d4cdd359b5cdb88f17c33ab7))
- remove unused parameter warning in OrderDetailView ([`9be3b9a`](https://github.com/mitienda-pe/mitienda-admin/commit/9be3b9a5b19c35adfb4af161ce2f656605cec4a6))
- **billing:** correct date display in documents list ([`c69dfb9`](https://github.com/mitienda-pe/mitienda-admin/commit/c69dfb9a1b87d05ab4f32cf5ac2411414e10c681))
- **netsuite:** use tiendaserieerp_codigo as Map key instead of empfacturacionserie_id ([`5aa740f`](https://github.com/mitienda-pe/mitienda-admin/commit/5aa740f0d06bde4204b1ed42e65fc301b1f4660b))
- apply Number conversion to promotions list view ([`eb8f0e0`](https://github.com/mitienda-pe/mitienda-admin/commit/eb8f0e031a3f99d63f47654ee82774cc9bdb01a9))
- convert tiendapromocion_estado to Number for proper comparison ([`2cc881c`](https://github.com/mitienda-pe/mitienda-admin/commit/2cc881c70e40a758d04d56617c6092a2371b0ae9))
- use computed property with getter/setter for toggle ([`b32396b`](https://github.com/mitienda-pe/mitienda-admin/commit/b32396b65ebb3b38f9f8291826b1434ef1a02496))
- toggle activation working correctly with v-model and watchers ([`306be12`](https://github.com/mitienda-pe/mitienda-admin/commit/306be1287f15ce15caa3167f5be8784bf0151282))
- convertir promocion_id a Number para comparación de tipo ([`e2cc488`](https://github.com/mitienda-pe/mitienda-admin/commit/e2cc488e2abc6d559c5dd90fec6d0a390680fd60))
- mostrar nombres de productos en LinkProductsDialog ([`294b00e`](https://github.com/mitienda-pe/mitienda-admin/commit/294b00ef89956dac821187d3d01e27bc7f80266e))
- mejorar layout y funcionalidad de ConfigureBonificationView ([`f23d30a`](https://github.com/mitienda-pe/mitienda-admin/commit/f23d30af453e0e6aa759fc0463c16a1097c92951))
- corregir errores de TypeScript en módulo de promociones ([`3aca36b`](https://github.com/mitienda-pe/mitienda-admin/commit/3aca36b9650e1820bd516e3557c20c82425e9b7e))

### Refactor

- **netsuite:** update frontend to use simplified locations architecture ([`40d28bd`](https://github.com/mitienda-pe/mitienda-admin/commit/40d28bd21b9a347663b2363496cf6a70703d510e))
- actualizar terminología de bonificaciones a activadores/premios ([`52b0702`](https://github.com/mitienda-pe/mitienda-admin/commit/52b0702ef3140e7574105b49baab20a48c1a783a))

## Octubre 2025

### Novedades

- Add support for unlimited stock products ([`c9b1e37`](https://github.com/mitienda-pe/mitienda-admin/commit/c9b1e372c1a46ccdf2f0192f02c61ee47e5dccfe))
- Add Vue.js views and navigation for API management module ([`8110031`](https://github.com/mitienda-pe/mitienda-admin/commit/8110031132455c722fdf37a1f6354b8786a9fcb6))
- Add frontend foundation for API credentials and webhooks management ([`33e2674`](https://github.com/mitienda-pe/mitienda-admin/commit/33e2674edb7fc36623a410034eaffb8fda0321da))
- Add PDF format selector to Nubefact configuration ([`ed8b413`](https://github.com/mitienda-pe/mitienda-admin/commit/ed8b413e57e84b68abcd8ca9967a49fcf9286377))
- Add document emission functionality to OrderDetailView ([`be21e4f`](https://github.com/mitienda-pe/mitienda-admin/commit/be21e4fe1872dd7e64506d8d27af609eb0c6bd8c))
- Add billing provider logos ([`5f2df2a`](https://github.com/mitienda-pe/mitienda-admin/commit/5f2df2ab789e40240c8467a3ecabf118a1907dfc))
- Add billing documents list and detail views ([`7777623`](https://github.com/mitienda-pe/mitienda-admin/commit/77776235a04d96aadf6d98670b2a5a26f815073d))
- Add billing documents types and API client methods ([`4f0a84b`](https://github.com/mitienda-pe/mitienda-admin/commit/4f0a84b6ac0c33acbf13a32bbc58dc0ece38ec1b))
- Convert Billing menu to dropdown with submenu ([`e752295`](https://github.com/mitienda-pe/mitienda-admin/commit/e752295802bc2563db442ab00e98265a11c300f7))
- Add Billing menu item to navigation ([`ca88589`](https://github.com/mitienda-pe/mitienda-admin/commit/ca885894a62093d5ded39a9b93f12f936ed7a40a))
- Add Nubefact billing configuration module ([`9ef22ba`](https://github.com/mitienda-pe/mitienda-admin/commit/9ef22ba63a16624ed711f707de8664fe67bb097a))
- Set default filter to show only published products ([`a4a005b`](https://github.com/mitienda-pe/mitienda-admin/commit/a4a005bbd3dbf7beae007217d1513467e51d6183))
- Add barcode field to products ([`9249c30`](https://github.com/mitienda-pe/mitienda-admin/commit/9249c3078ec916a2bfacfd983ccf1c64869b7f6b))
- Add image migration UI with real-time feedback and error handling ([`4eecc6c`](https://github.com/mitienda-pe/mitienda-admin/commit/4eecc6c32f9a2a4b9ab85b59846cdd9b190b7249))
- Add product filter, SKU column and improved stats to S3 migration ([`30d2f1c`](https://github.com/mitienda-pe/mitienda-admin/commit/30d2f1ceb39e91247cb032c053991e15f7dca03c))
- Add S3 Migration view for Super-Admin ([`493548c`](https://github.com/mitienda-pe/mitienda-admin/commit/493548c2893054b51c9e49b102d0d20a50fb7ab3))
- Implementar sidebar diferenciado y fix flujo de impersonación ([`c3410e0`](https://github.com/mitienda-pe/mitienda-admin/commit/c3410e08fe99bf2b3c303dfe9dc24ba6f6b59d3d))
- Agregar página de debug para verificar estado de SuperAdmin ([`f3418f2`](https://github.com/mitienda-pe/mitienda-admin/commit/f3418f2c2081790176b817edf23c7d39d9472e0a))
- Implementar módulo Super-Admin para gestión de tiendas ([`2d2d86a`](https://github.com/mitienda-pe/mitienda-admin/commit/2d2d86abb8ddd745df9cb198e1ca75c2f2082cc4))
- Implementar frontend para Announcement Bars ([`d1d5dab`](https://github.com/mitienda-pe/mitienda-admin/commit/d1d5dab163f42323f0ab54fa8699c0809f7da96d))
- Agregar enlace a Etiquetas en menú de Catálogo ([`ed2f44f`](https://github.com/mitienda-pe/mitienda-admin/commit/ed2f44fa57f5b6512ba8a2f9d803e2842a254399))
- Agregar validación de límite de 8 etiquetas en ProductTagAssignment ([`183ed9a`](https://github.com/mitienda-pe/mitienda-admin/commit/183ed9a5445d221b66d13a7f56d039be4e5695d2))
- Implementar vista de página completa con preview para Product Tags ([`edaed48`](https://github.com/mitienda-pe/mitienda-admin/commit/edaed4852fae18d55ce08e2a0298c6f68a107aa4))
- Agregar módulo de Product Tags/Ribbons en Vue 3 ([`ef82d9c`](https://github.com/mitienda-pe/mitienda-admin/commit/ef82d9c50e5e7477e49e19089db840a6eaaa4655))
- Implementar sistema de carga de imágenes con Cloudflare Images ([`18c6191`](https://github.com/mitienda-pe/mitienda-admin/commit/18c61910f605e094cfb331dd38188d1acbae7a4e))
- Implementar editores de descripción con TinyMCE y Monaco ([`c284b9a`](https://github.com/mitienda-pe/mitienda-admin/commit/c284b9ab421141974099b197b285fa037e63ff07))
- Support multiple categories per product ([`78974cc`](https://github.com/mitienda-pe/mitienda-admin/commit/78974cc686439bb523eb62b7c2f751069ce32495))
- Display external category names with icons ([`1b2d9c9`](https://github.com/mitienda-pe/mitienda-admin/commit/1b2d9c9732cfb8fd9ba86dd435817aee32eb89ff))
- Add external categories display (Facebook, Google, MercadoLibre) ([`1a07da7`](https://github.com/mitienda-pe/mitienda-admin/commit/1a07da7676bdf6b8894125fcbc349b78b711bca3))
- Add producto_orden field and fix video aspect-ratio ([`212e65d`](https://github.com/mitienda-pe/mitienda-admin/commit/212e65dd75c6bdf0c9658aa048ca1c49085fd9df))
- Agregar card SEO en vista de producto ([`db3b9e6`](https://github.com/mitienda-pe/mitienda-admin/commit/db3b9e64898bdbf1e1ff125a03b365d79475ffb6))
- Implementar cálculo automático de peso volumétrico ([`92db23c`](https://github.com/mitienda-pe/mitienda-admin/commit/92db23c6b22dab809078e4e868c8d6658646429f))
- Agregar card de Dimensiones y Peso ([`98eaa83`](https://github.com/mitienda-pe/mitienda-admin/commit/98eaa8314a8bab061bc601f22bc8499da365553f))
- Mejorar cards de media en vista de producto ([`59fa476`](https://github.com/mitienda-pe/mitienda-admin/commit/59fa476274871289e0fc5ab29bdf7acffe189934))
- Reorganizar layout de vista de producto en dos columnas ([`86b7737`](https://github.com/mitienda-pe/mitienda-admin/commit/86b7737580aa2d34769d721d8df12ebcaa1b5e5d))
- Convertir uploader de documentos en modal ([`7f1cfbd`](https://github.com/mitienda-pe/mitienda-admin/commit/7f1cfbd9e02d9620e96489139d38ac222cdd2b30))
- Agregar componentes para gestión de documentos PDF ([`c4bc32e`](https://github.com/mitienda-pe/mitienda-admin/commit/c4bc32e3adec2c5e57ad45c9a31999a375c8de83))
- Mejorar feedback de progreso en upload de video ([`8c44a02`](https://github.com/mitienda-pe/mitienda-admin/commit/8c44a02a3a0053e9075ef7a4f5771a6aee169f99))
- Implementar aspect ratio dinámico para videos ([`356ee03`](https://github.com/mitienda-pe/mitienda-admin/commit/356ee03373b964ffe4e90f38ab3c58e94c45eded))
- Implementar upload directo de video a Cloudflare ([`b89d1e4`](https://github.com/mitienda-pe/mitienda-admin/commit/b89d1e4a227d0b9911a1fd9e7fe06fd633f0ebc5))
- Agregar reproductor de video de producto con Cloudflare Stream ([`782ba83`](https://github.com/mitienda-pe/mitienda-admin/commit/782ba83560a1539973df1ea822f9808e69d771de))
- Implementar componente de subida de videos para productos ([`f4cac50`](https://github.com/mitienda-pe/mitienda-admin/commit/f4cac503dc269be973c7c811a25faa74d53110e5))
- Agregar tipos y API methods para videos de productos ([`5fde780`](https://github.com/mitienda-pe/mitienda-admin/commit/5fde7804abaa26f1b1ba1326effcf478f05b7a77))
- Agregar FRD de videos y preparación para feature de videos ([`b71e610`](https://github.com/mitienda-pe/mitienda-admin/commit/b71e610fd0fb83de147a4931a0ce4bfdc29c5618))
- Mapear respuesta de tiendas y probar todos los endpoints ([`7deb3b3`](https://github.com/mitienda-pe/mitienda-admin/commit/7deb3b3937bacd8a324e82246d995981e036bae7))
- Implementación inicial del backoffice MiTienda Vue 3 ([`ec2fdeb`](https://github.com/mitienda-pe/mitienda-admin/commit/ec2fdeb1566e2dccc1a4b0c470642893d41ad13f))

### Correcciones

- corregir mapeo de metadata de paginación en products API ([`f173e07`](https://github.com/mitienda-pe/mitienda-admin/commit/f173e0741c4a488ace30791b7c8da510f43cedb8))
- corregir paginación de productos en vista de inventario ([`70479e9`](https://github.com/mitienda-pe/mitienda-admin/commit/70479e9833a1a8aaa15facc0f788fe7679f4e5f4))
- Filter out unlimited stock products from out_of_stock and limited filters ([`66f4f7d`](https://github.com/mitienda-pe/mitienda-admin/commit/66f4f7daf123d287625988c11a64ddc8546ff085))
- Remove unused StoreCredential import from api-credentials.api.ts ([`9c1cbb0`](https://github.com/mitienda-pe/mitienda-admin/commit/9c1cbb0bb89a0351d446b362a4310a3e95d50b85))
- Comment out unused StoreCredential interface to fix TypeScript build ([`c93ec24`](https://github.com/mitienda-pe/mitienda-admin/commit/c93ec24fda6bd0f731ac5cf209c5c6f3ec91f159))
- Add eslint-disable comment for unused StoreCredential type ([`555deba`](https://github.com/mitienda-pe/mitienda-admin/commit/555deba0d02f19115c8a2e4e47420dde2ad08ed2))
- Make sidebar submenus clickable while maintaining auto-expand behavior ([`d300319`](https://github.com/mitienda-pe/mitienda-admin/commit/d3003193217a73cea0b6778db5b4f1c8f94af9ad))
- Make sidebar submenus expand based on current route ([`860a285`](https://github.com/mitienda-pe/mitienda-admin/commit/860a2856bffbb4aad5dd3a7205ac7a43138d263c))
- Update Vite proxy to avoid conflicts with Vue Router ([`1dce2db`](https://github.com/mitienda-pe/mitienda-admin/commit/1dce2dbd8b4dc4b36462eb19e82568822142ebd6))
- Revert incorrect billing documents data structure change ([`27804e2`](https://github.com/mitienda-pe/mitienda-admin/commit/27804e2f4b5ef63577ee8747aa21eda7e0cc61ee))
- Resolve TypeScript compilation errors in billing module ([`12f4ddc`](https://github.com/mitienda-pe/mitienda-admin/commit/12f4ddc1eea057a32402b216c875916f38d9cccf))
- Add Netlify redirects and correct barcode update script ([`dbb3571`](https://github.com/mitienda-pe/mitienda-admin/commit/dbb3571717b7aadfcf40ba07e5c2f8933c9b3e59))
- Improve barcode field styling and display ([`e7f46d0`](https://github.com/mitienda-pe/mitienda-admin/commit/e7f46d0fc2d246ded3f119bd2b1a0508a6a94c7f))
- Add better error handling for HTML responses from API ([`84c7cdc`](https://github.com/mitienda-pe/mitienda-admin/commit/84c7cdc2245ab29749561ca0c1476712868ddaae))
- Remove unused posicionOptions variable ([`1479874`](https://github.com/mitienda-pe/mitienda-admin/commit/14798747afc7083527eb4ebee554392083f1dc49))
- Resolve TypeScript errors for Netlify build ([`3758294`](https://github.com/mitienda-pe/mitienda-admin/commit/3758294de98cb791a5bef565ad58d1ae0ae5a976))
- Use S3 URLs for image preview instead of CloudFront ([`036a04a`](https://github.com/mitienda-pe/mitienda-admin/commit/036a04aad67ae758a51466889c3d5299f1e33036))
- Use correct localStorage key for access token ([`27143d3`](https://github.com/mitienda-pe/mitienda-admin/commit/27143d36d249fc939dd91dbf191e97ae1c6ccd60))
- Implement smart login flow for different user types ([`487a89e`](https://github.com/mitienda-pe/mitienda-admin/commit/487a89ebaa0422ee16499a24fea60141871dede2))
- Ajustar ruta de debug superadmin para evitar conflicto con DashboardLayout ([`9301694`](https://github.com/mitienda-pe/mitienda-admin/commit/9301694dfcf4631c04f88bb0e7930d0deb8d56e0))
- Reemplazar botones por radio buttons para selección de posición ([`992ed93`](https://github.com/mitienda-pe/mitienda-admin/commit/992ed93ca022df635b7780d7913450f8686dfc8c))
- Cambiar formData de ref a reactive para mejor reactividad ([`192beaa`](https://github.com/mitienda-pe/mitienda-admin/commit/192beaad95c5608bdb596af2efd14220eeef0eac))
- Asignar propiedades individualmente para mantener reactividad ([`3ce4398`](https://github.com/mitienda-pe/mitienda-admin/commit/3ce43982854bb350069d992255c009979b0b84a2))
- Reorganizar grid de selección de posición con layout correcto ([`5122ba4`](https://github.com/mitienda-pe/mitienda-admin/commit/5122ba47d78d2b10d0da1821c06adf544fc92bc7))
- Ajustar tamaño de campos de color y breakpoint responsive ([`4309db2`](https://github.com/mitienda-pe/mitienda-admin/commit/4309db295273ca50bc922031542092b836d32c92))
- Cambiar breakpoint de responsive de md a sm en ProductTagFormView ([`5e7cf55`](https://github.com/mitienda-pe/mitienda-admin/commit/5e7cf55bd88628a5c97a287ff2e9179e7c3f3a0f))
- Uniformizar controles y hacer grids responsive ([`0a013b9`](https://github.com/mitienda-pe/mitienda-admin/commit/0a013b9e1946e760f8a5b84bb9627afbda05a6b3))
- Agregar bordes a inputs en ProductTagFormView ([`47c3464`](https://github.com/mitienda-pe/mitienda-admin/commit/47c3464a3a1b96d176f12149f266aaf0834e4c6a))
- Mejorar color pickers y botones en formularios ([`f9ea271`](https://github.com/mitienda-pe/mitienda-admin/commit/f9ea271233cc956002a6cc8e2ea607cf33ba0925))
- Reemplazar Checkbox de PrimeVue por checkboxes nativos ([`1c4c86f`](https://github.com/mitienda-pe/mitienda-admin/commit/1c4c86fa58d75c72c296f7b888557b2c5be153ca))
- Mejorar checkboxes marcados y hacer responsive grids de colores ([`b70402e`](https://github.com/mitienda-pe/mitienda-admin/commit/b70402e1a8f22b6a309f6f2c8abc2831b5f09999))
- Forzar estilos de checkboxes e inputs con !important ([`3a1f1ec`](https://github.com/mitienda-pe/mitienda-admin/commit/3a1f1ecc9140eb780c67bec988455bdc75dd0d2d))
- Mejorar visibilidad de checkboxes y bordes de campos ([`46dc7c5`](https://github.com/mitienda-pe/mitienda-admin/commit/46dc7c5e84cc7d1e50391c88bd828beee54afa09))
- Ajustar ancho de inputs type=color ([`bbb5f1e`](https://github.com/mitienda-pe/mitienda-admin/commit/bbb5f1ef6b1c9af85849dcddb7b24aa09fbeb911))
- Usar input type=color nativo en lugar de ColorPicker de PrimeVue ([`b893373`](https://github.com/mitienda-pe/mitienda-admin/commit/b893373f8b23ae8df791563cacdaabd8bd0d4c71))
- Usar Calendar en lugar de DatePicker para PrimeVue 3 ([`f7b741d`](https://github.com/mitienda-pe/mitienda-admin/commit/f7b741dc89d5cab47773727fdfe21c2d622203b5))
- Corregir import de apiClient en announcement-bars.api.ts ([`53c51df`](https://github.com/mitienda-pe/mitienda-admin/commit/53c51df236ff7a8cd01b0edc19c3acaaf51f1442))
- Simplificar configuración de vue-advanced-cropper ([`b20a4b0`](https://github.com/mitienda-pe/mitienda-admin/commit/b20a4b0a439d73808604dce45647be4550d81e2d))
- Agregar import de Divider en ProductDetailView ([`33894bd`](https://github.com/mitienda-pe/mitienda-admin/commit/33894bd69b42484d4619d6af467d748dbe88378f))
- Importar TinyMCE explícitamente para evitar CDN ([`0e7ddae`](https://github.com/mitienda-pe/mitienda-admin/commit/0e7ddae3c3c4b87a53b81ad505cf217a30e91b2f))
- Configurar TinyMCE como self-hosted sin API key ([`dec13a2`](https://github.com/mitienda-pe/mitienda-admin/commit/dec13a26c363367babe7a127acbb444d69d3b1d4))
- Consolidate external category display in single line ([`d065e7a`](https://github.com/mitienda-pe/mitienda-admin/commit/d065e7a18eed5493764c6ca35a35ce36e9157e63))
- Mapear campos de dimensiones y peso en products API ([`a5d6c8e`](https://github.com/mitienda-pe/mitienda-admin/commit/a5d6c8ea6ed97c7e707b89eb72fa4b3fe8ee4a9e))
- Mostrar dimensiones y peso incluso cuando valores son 0 ([`765d14f`](https://github.com/mitienda-pe/mitienda-admin/commit/765d14f27afbd5a79e01b5a41a6fee1acc5ff18a))
- Corregir errores de TypeScript para build de producción ([`54a39d9`](https://github.com/mitienda-pe/mitienda-admin/commit/54a39d900cf8e95e11c3ba499945c28168d7234b))
- Volver a POST multipart/form-data con uploadURL correcto ([`2e48b10`](https://github.com/mitienda-pe/mitienda-admin/commit/2e48b10d9f6d2cbaf2d353dd6bb7992bdd9da60d))
- Usar TUS protocol con tus-js-client para uploads ([`f716e8c`](https://github.com/mitienda-pe/mitienda-admin/commit/f716e8cfe17e3724818c1a5680766d204f7e99ab))
- Configurar <stream> como custom element en Vue ([`fff79f7`](https://github.com/mitienda-pe/mitienda-admin/commit/fff79f78dbfa992a9c8c85a10e05ccdf77ae0f9a))
- Aumentar timeout a 5 minutos para uploads de video ([`70b6f75`](https://github.com/mitienda-pe/mitienda-admin/commit/70b6f75a1eafec79b352a6b68f8032348474e9fd))
- Permitir FormData en interceptor de Axios ([`9e6a8c0`](https://github.com/mitienda-pe/mitienda-admin/commit/9e6a8c014825ed6ebe83ad675515bc69cda7c8d6))
- Remover header Content-Type manual en uploadVideo ([`1679158`](https://github.com/mitienda-pe/mitienda-admin/commit/1679158f072864055ead4ca5ff3e7cc94887985d))
- Corregir error de URL.createObjectURL en ProductVideoUploader ([`7f1a03c`](https://github.com/mitienda-pe/mitienda-admin/commit/7f1a03c2ade12347a7684c941b4a5bb4a458c068))
- Restaurar navegación a detalle de pedidos ([`90bda30`](https://github.com/mitienda-pe/mitienda-admin/commit/90bda30982c7cc543ebc04f89a7f74a9f1278a65))
- Corregir mapeo de datos de pedidos (orders) ([`94e9efa`](https://github.com/mitienda-pe/mitienda-admin/commit/94e9efa1553601a5f84a57db553ba84be86cc079))
- Solucionar CORS y normalizar respuestas de la API ([`40156fd`](https://github.com/mitienda-pe/mitienda-admin/commit/40156fd20ab27d55ecc88e96b59eb1c487d455c0))
- Cambiar API URL a api2.mitienda.pe y actualizar config Nginx ([`93aeebc`](https://github.com/mitienda-pe/mitienda-admin/commit/93aeebc4334edf91fc8e323a838563405c5e472b))

### Refactor

- Restructure billing to provider-based architecture ([`aaedf03`](https://github.com/mitienda-pe/mitienda-admin/commit/aaedf03666aaa5803e18355aa6ded433cd635b92))
- Simplificar vista previa a solo imagen con etiqueta ([`0fc3b37`](https://github.com/mitienda-pe/mitienda-admin/commit/0fc3b37668b5f0f7f5c632a7755baf2604dfa1ef))
- Consolidate product info into Información Adicional card ([`cc38a6c`](https://github.com/mitienda-pe/mitienda-admin/commit/cc38a6c62d30403cf1b9f3810f924cccae820c19))
- Reorder fields in Información Adicional card ([`8393676`](https://github.com/mitienda-pe/mitienda-admin/commit/8393676a03c1e325935a6db187d632ce8339fe4a))
- Left-align all content in Información Adicional card ([`fd7c824`](https://github.com/mitienda-pe/mitienda-admin/commit/fd7c82494a52897105d2c890dcd81cf717339e76))
- Clean up Información Adicional card layout ([`992a718`](https://github.com/mitienda-pe/mitienda-admin/commit/992a71825626c24f5d2ebc69da560fe7f8f57b7a))

