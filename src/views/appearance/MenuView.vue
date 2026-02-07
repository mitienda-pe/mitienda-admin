<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useMenuStore } from '@/stores/menu.store'
import { AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import {
  MENU_LINK_TYPE_OPTIONS,
  MENU_LINK_TYPE_LABELS,
  type MenuLinkType,
  type MenuItem,
  type LinkOption,
  type LinkOptionGroup
} from '@/types/menu.types'

const toast = useToast()
const menuStore = useMenuStore()

// ─── Add Item Form ───
const formLabel = ref('')
const formType = ref<MenuLinkType>('categoria')
const formUrl = ref('')
const formParentId = ref(0)
const formTargetBlank = ref(false)

// Link options for the selected type
const linkOptions = ref<LinkOption[]>([])
const subcategoryGroups = ref<LinkOptionGroup[]>([])
const selectedOption = ref<LinkOption | null>(null)
const selectedSubcatParent = ref<LinkOptionGroup | null>(null)
const selectedSubcatChild = ref<LinkOption | null>(null)

// Inline editing
const editingItemId = ref<number | null>(null)
const editingLabel = ref('')

// Delete confirmation
const showDeleteDialog = ref(false)
const itemToDelete = ref<MenuItem | null>(null)
const showDeleteMenuDialog = ref(false)

// Parent dropdown options
const parentOptions = computed(() => {
  return [{ id: 0, label: 'Ninguno (nivel superior)' }, ...menuStore.availableParents]
})

// ─── Watch type changes to load options ───
watch(formType, async newType => {
  selectedOption.value = null
  selectedSubcatParent.value = null
  selectedSubcatChild.value = null
  formUrl.value = ''

  if (newType === 'url') return

  const options = await menuStore.fetchLinkOptions(newType)

  if (newType === 'subcategoria') {
    subcategoryGroups.value = options as LinkOptionGroup[]
    linkOptions.value = []
  } else {
    linkOptions.value = options as LinkOption[]
    subcategoryGroups.value = []
  }
})

// Watch subcategory parent selection to show children
const subcatChildren = computed(() => {
  return selectedSubcatParent.value?.children ?? []
})

// ─── When selecting an option, auto-fill label and URL ───
watch(selectedOption, option => {
  if (!option) return
  if (!formLabel.value) formLabel.value = option.label
  formUrl.value = option.slug ?? String(option.id)
})

watch(selectedSubcatChild, child => {
  if (!child || !selectedSubcatParent.value) return
  if (!formLabel.value) formLabel.value = child.label
  formUrl.value = `${child.parentSlug}$$$${child.slug}`
})

// ─── Actions ───
async function handleCreateMenu() {
  try {
    await menuStore.createMenu()
    toast.add({ severity: 'success', summary: 'Menú creado', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al crear el menú', life: 3000 })
  }
}

async function handleAddItem() {
  if (!formLabel.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Ingresa una etiqueta', life: 3000 })
    return
  }
  if (!formUrl.value.trim() && formType.value !== 'url') {
    toast.add({ severity: 'warn', summary: 'Selecciona un elemento', life: 3000 })
    return
  }
  if (formType.value === 'url' && !formUrl.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Ingresa una URL', life: 3000 })
    return
  }

  try {
    await menuStore.addItem({
      label: formLabel.value.trim(),
      type: formType.value,
      url: formUrl.value.trim(),
      parentId: formParentId.value,
      targetBlank: formTargetBlank.value
    })
    toast.add({ severity: 'success', summary: 'Enlace agregado', life: 3000 })
    resetForm()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al agregar enlace', life: 3000 })
  }
}

function resetForm() {
  formLabel.value = ''
  formUrl.value = ''
  formParentId.value = 0
  formTargetBlank.value = false
  selectedOption.value = null
  selectedSubcatParent.value = null
  selectedSubcatChild.value = null
}

// ─── Inline Edit ───
function startEditing(item: MenuItem) {
  editingItemId.value = item.id
  editingLabel.value = item.label
}

function cancelEditing() {
  editingItemId.value = null
  editingLabel.value = ''
}

async function saveEditing() {
  if (!editingItemId.value || !editingLabel.value.trim()) return
  try {
    await menuStore.updateItem(editingItemId.value, { label: editingLabel.value.trim() })
    toast.add({ severity: 'success', summary: 'Etiqueta actualizada', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al actualizar', life: 3000 })
  } finally {
    cancelEditing()
  }
}

// ─── Delete ───
function confirmDelete(item: MenuItem) {
  itemToDelete.value = item
  showDeleteDialog.value = true
}

async function handleDeleteItem() {
  if (!itemToDelete.value) return
  try {
    await menuStore.deleteItem(itemToDelete.value.id)
    toast.add({ severity: 'success', summary: 'Enlace eliminado', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: menuStore.error ?? 'Error al eliminar', life: 3000 })
  } finally {
    showDeleteDialog.value = false
    itemToDelete.value = null
  }
}

async function handleDeleteMenu() {
  try {
    await menuStore.deleteMenu()
    toast.add({ severity: 'success', summary: 'Menú eliminado', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al eliminar el menú', life: 3000 })
  } finally {
    showDeleteMenuDialog.value = false
  }
}

// ─── Reorder ───
async function moveItem(item: MenuItem, siblings: MenuItem[], direction: 'up' | 'down') {
  const currentIndex = siblings.findIndex(s => s.id === item.id)
  if (currentIndex === -1) return
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= siblings.length) return

  // Swap in a copy
  const reordered = [...siblings]
  ;[reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex]
  ]

  // Build reorder payload for these siblings
  const payload = reordered.map((s, i) => ({
    id: s.id,
    parentId: s.parentId,
    order: i + 1
  }))

  try {
    await menuStore.reorderItems(payload)
  } catch {
    toast.add({ severity: 'error', summary: 'Error al reordenar', life: 3000 })
  }
}

function getTypeSeverity(type: MenuLinkType): string {
  const map: Record<string, string> = {
    categoria: 'info',
    subcategoria: 'info',
    producto: 'success',
    marca: 'warning',
    gamma: 'warning',
    lista: '',
    pagina: 'contrast',
    blog: 'contrast',
    url: 'danger'
  }
  return map[type] ?? ''
}

function hasChildren(item: MenuItem): boolean {
  return !!item.children && item.children.length > 0
}

onMounted(() => {
  menuStore.fetchMenu()
})
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary">Menú de Navegación</h1>
      <p class="text-secondary-500 mt-1">
        Administra los enlaces del menú de navegación de tu tienda
      </p>
    </div>

    <!-- Loading -->
    <div v-if="menuStore.isLoading" class="flex justify-center p-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState
      v-else-if="menuStore.error && !menuStore.hasMenu"
      :message="menuStore.error"
      @retry="menuStore.fetchMenu"
    />

    <!-- Empty State: no menu -->
    <AppEmptyState
      v-else-if="!menuStore.hasMenu"
      icon="pi pi-bars"
      title="No tienes un menú de navegación"
      description="Crea un menú para que tus clientes puedan navegar por tu tienda"
      action-label="Crear Menú"
      @action="handleCreateMenu"
    />

    <!-- Menu Editor -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Panel: Add Link Form -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-lg font-semibold text-secondary mb-4">Agregar Enlace</h2>

          <!-- Label -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-secondary-700 mb-1">Etiqueta</label>
            <InputText v-model="formLabel" placeholder="Texto del enlace" class="w-full" />
          </div>

          <!-- Link Type -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de enlace</label>
            <Dropdown
              v-model="formType"
              :options="MENU_LINK_TYPE_OPTIONS"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>

          <!-- Dynamic selector based on type -->
          <div class="mb-4">
            <!-- URL libre -->
            <template v-if="formType === 'url'">
              <label class="block text-sm font-medium text-secondary-700 mb-1">URL</label>
              <InputText v-model="formUrl" placeholder="https://ejemplo.com" class="w-full" />
            </template>

            <!-- Subcategoría: two dropdowns -->
            <template v-else-if="formType === 'subcategoria'">
              <label class="block text-sm font-medium text-secondary-700 mb-1"
                >Categoría padre</label
              >
              <Dropdown
                v-model="selectedSubcatParent"
                :options="subcategoryGroups"
                :option-label="(g: LinkOptionGroup) => g.parent.label"
                placeholder="Seleccionar categoría"
                class="w-full mb-2"
                :loading="menuStore.isLoadingOptions"
              />
              <label
                v-if="selectedSubcatParent"
                class="block text-sm font-medium text-secondary-700 mb-1"
              >
                Subcategoría
              </label>
              <Dropdown
                v-if="selectedSubcatParent"
                v-model="selectedSubcatChild"
                :options="subcatChildren"
                option-label="label"
                placeholder="Seleccionar subcategoría"
                class="w-full"
                filter
              />
            </template>

            <!-- Generic entity selector -->
            <template v-else>
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                {{ MENU_LINK_TYPE_LABELS[formType] }}
              </label>
              <Dropdown
                v-model="selectedOption"
                :options="linkOptions"
                option-label="label"
                :placeholder="`Seleccionar ${MENU_LINK_TYPE_LABELS[formType].toLowerCase()}`"
                class="w-full"
                filter
                :loading="menuStore.isLoadingOptions"
              />
            </template>
          </div>

          <!-- Parent -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-secondary-700 mb-1">Elemento padre</label>
            <Dropdown
              v-model="formParentId"
              :options="parentOptions"
              option-label="label"
              option-value="id"
              class="w-full"
            />
          </div>

          <!-- Target blank -->
          <div class="mb-5 flex items-center gap-2">
            <Checkbox v-model="formTargetBlank" :binary="true" input-id="targetBlank" />
            <label for="targetBlank" class="text-sm text-secondary-700 cursor-pointer">
              Abrir en nueva pestaña
            </label>
          </div>

          <!-- Add button -->
          <AppButton
            label="Agregar enlace"
            icon="pi pi-plus"
            variant="primary"
            class="w-full"
            :loading="menuStore.isSaving"
            @click="handleAddItem"
          />
        </div>
      </div>

      <!-- Right Panel: Menu Tree -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-secondary">Estructura del Menú</h2>
            <span class="text-sm text-secondary-500">
              {{ menuStore.menuItems.length }} elemento(s)
            </span>
          </div>

          <!-- Empty tree -->
          <div v-if="menuStore.menuItems.length === 0" class="text-center py-8 text-secondary-400">
            <i class="pi pi-bars text-4xl mb-3 block" />
            <p>El menú está vacío. Agrega enlaces desde el panel izquierdo.</p>
          </div>

          <!-- Tree -->
          <ul v-else class="space-y-1">
            <li
              v-for="(item, index) in menuStore.menuItems"
              :key="item.id"
              class="border border-gray-100 rounded-lg"
            >
              <!-- Level 0 item -->
              <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group">
                <i class="pi pi-grip-vertical text-gray-300" />

                <!-- Inline editing -->
                <template v-if="editingItemId === item.id">
                  <InputText
                    v-model="editingLabel"
                    class="flex-1 p-inputtext-sm"
                    autofocus
                    @keyup.enter="saveEditing"
                    @keyup.escape="cancelEditing"
                  />
                  <button
                    class="text-green-600 hover:text-green-800"
                    title="Guardar"
                    @click="saveEditing"
                  >
                    <i class="pi pi-check" />
                  </button>
                  <button
                    class="text-gray-400 hover:text-gray-600"
                    title="Cancelar"
                    @click="cancelEditing"
                  >
                    <i class="pi pi-times" />
                  </button>
                </template>

                <template v-else>
                  <span class="flex-1 font-medium text-secondary-700">{{ item.label }}</span>
                  <Tag
                    :value="MENU_LINK_TYPE_LABELS[item.type]"
                    :severity="getTypeSeverity(item.type)"
                    class="text-xs"
                  />
                  <span v-if="item.targetBlank" title="Abre en nueva pestaña" class="text-gray-400">
                    <i class="pi pi-external-link text-xs" />
                  </span>
                  <span v-if="hasChildren(item)" class="text-xs text-secondary-400">
                    ({{ item.children!.length }})
                  </span>

                  <!-- Actions -->
                  <div
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      v-if="index > 0"
                      class="p-1 text-gray-400 hover:text-primary"
                      title="Mover arriba"
                      @click="moveItem(item, menuStore.menuItems, 'up')"
                    >
                      <i class="pi pi-arrow-up text-xs" />
                    </button>
                    <button
                      v-if="index < menuStore.menuItems.length - 1"
                      class="p-1 text-gray-400 hover:text-primary"
                      title="Mover abajo"
                      @click="moveItem(item, menuStore.menuItems, 'down')"
                    >
                      <i class="pi pi-arrow-down text-xs" />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-primary"
                      title="Editar"
                      @click="startEditing(item)"
                    >
                      <i class="pi pi-pencil text-xs" />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-red-500"
                      title="Eliminar"
                      @click="confirmDelete(item)"
                    >
                      <i class="pi pi-trash text-xs" />
                    </button>
                  </div>
                </template>
              </div>

              <!-- Level 1 children -->
              <ul v-if="hasChildren(item)" class="ml-6 mt-1 mb-2 space-y-1">
                <li v-for="(child, ci) in item.children" :key="child.id">
                  <div class="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-gray-50">
                    <i class="pi pi-grip-vertical text-gray-200" />

                    <template v-if="editingItemId === child.id">
                      <InputText
                        v-model="editingLabel"
                        class="flex-1 p-inputtext-sm"
                        autofocus
                        @keyup.enter="saveEditing"
                        @keyup.escape="cancelEditing"
                      />
                      <button class="text-green-600 hover:text-green-800" @click="saveEditing">
                        <i class="pi pi-check" />
                      </button>
                      <button class="text-gray-400 hover:text-gray-600" @click="cancelEditing">
                        <i class="pi pi-times" />
                      </button>
                    </template>

                    <template v-else>
                      <span class="flex-1 text-secondary-600">{{ child.label }}</span>
                      <Tag
                        :value="MENU_LINK_TYPE_LABELS[child.type]"
                        :severity="getTypeSeverity(child.type)"
                        class="text-xs"
                      />
                      <span v-if="child.targetBlank" class="text-gray-400">
                        <i class="pi pi-external-link text-xs" />
                      </span>
                      <span v-if="hasChildren(child)" class="text-xs text-secondary-400">
                        ({{ child.children!.length }})
                      </span>

                      <div
                        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <button
                          v-if="ci > 0"
                          class="p-1 text-gray-400 hover:text-primary"
                          @click="moveItem(child, item.children!, 'up')"
                        >
                          <i class="pi pi-arrow-up text-xs" />
                        </button>
                        <button
                          v-if="ci < item.children!.length - 1"
                          class="p-1 text-gray-400 hover:text-primary"
                          @click="moveItem(child, item.children!, 'down')"
                        >
                          <i class="pi pi-arrow-down text-xs" />
                        </button>
                        <button
                          class="p-1 text-gray-400 hover:text-primary"
                          @click="startEditing(child)"
                        >
                          <i class="pi pi-pencil text-xs" />
                        </button>
                        <button
                          class="p-1 text-gray-400 hover:text-red-500"
                          @click="confirmDelete(child)"
                        >
                          <i class="pi pi-trash text-xs" />
                        </button>
                      </div>
                    </template>
                  </div>

                  <!-- Level 2 grandchildren -->
                  <ul v-if="hasChildren(child)" class="ml-6 mt-1 space-y-1">
                    <li v-for="(grandchild, gi) in child.children" :key="grandchild.id">
                      <div
                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg group hover:bg-gray-50"
                      >
                        <i class="pi pi-grip-vertical text-gray-200" />

                        <template v-if="editingItemId === grandchild.id">
                          <InputText
                            v-model="editingLabel"
                            class="flex-1 p-inputtext-sm"
                            autofocus
                            @keyup.enter="saveEditing"
                            @keyup.escape="cancelEditing"
                          />
                          <button class="text-green-600 hover:text-green-800" @click="saveEditing">
                            <i class="pi pi-check" />
                          </button>
                          <button class="text-gray-400 hover:text-gray-600" @click="cancelEditing">
                            <i class="pi pi-times" />
                          </button>
                        </template>

                        <template v-else>
                          <span class="flex-1 text-sm text-secondary-500">{{
                            grandchild.label
                          }}</span>
                          <Tag
                            :value="MENU_LINK_TYPE_LABELS[grandchild.type]"
                            :severity="getTypeSeverity(grandchild.type)"
                            class="text-xs"
                          />
                          <span v-if="grandchild.targetBlank" class="text-gray-400">
                            <i class="pi pi-external-link text-xs" />
                          </span>

                          <div
                            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <button
                              v-if="gi > 0"
                              class="p-1 text-gray-400 hover:text-primary"
                              @click="moveItem(grandchild, child.children!, 'up')"
                            >
                              <i class="pi pi-arrow-up text-xs" />
                            </button>
                            <button
                              v-if="gi < child.children!.length - 1"
                              class="p-1 text-gray-400 hover:text-primary"
                              @click="moveItem(grandchild, child.children!, 'down')"
                            >
                              <i class="pi pi-arrow-down text-xs" />
                            </button>
                            <button
                              class="p-1 text-gray-400 hover:text-primary"
                              @click="startEditing(grandchild)"
                            >
                              <i class="pi pi-pencil text-xs" />
                            </button>
                            <button
                              class="p-1 text-gray-400 hover:text-red-500"
                              @click="confirmDelete(grandchild)"
                            >
                              <i class="pi pi-trash text-xs" />
                            </button>
                          </div>
                        </template>
                      </div>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>

          <!-- Delete menu button -->
          <div class="mt-6 pt-4 border-t border-gray-100">
            <AppButton
              label="Eliminar Menú Completo"
              icon="pi pi-trash"
              variant="danger"
              @click="showDeleteMenuDialog = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Item Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar enlace"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-2xl text-yellow-500 mt-1" />
        <div>
          <p v-if="itemToDelete && hasChildren(itemToDelete)">
            El enlace <strong>{{ itemToDelete.label }}</strong> tiene
            <strong>{{ itemToDelete.children!.length }}</strong> elemento(s) hijo(s). Debes eliminar
            los hijos primero.
          </p>
          <p v-else>
            ¿Estás seguro de que deseas eliminar el enlace
            <strong>{{ itemToDelete?.label }}</strong
            >?
          </p>
        </div>
      </div>
      <template #footer>
        <AppButton label="Cancelar" variant="outlined" @click="showDeleteDialog = false" />
        <AppButton
          v-if="itemToDelete && !hasChildren(itemToDelete)"
          label="Eliminar"
          variant="danger"
          icon="pi pi-trash"
          :loading="menuStore.isSaving"
          @click="handleDeleteItem"
        />
      </template>
    </Dialog>

    <!-- Delete Menu Dialog -->
    <Dialog
      v-model:visible="showDeleteMenuDialog"
      header="Eliminar menú completo"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-2xl text-red-500 mt-1" />
        <p>Esta acción eliminará el menú y <strong>todos sus enlaces</strong>. ¿Estás seguro?</p>
      </div>
      <template #footer>
        <AppButton label="Cancelar" variant="outlined" @click="showDeleteMenuDialog = false" />
        <AppButton
          label="Eliminar todo"
          variant="danger"
          icon="pi pi-trash"
          :loading="menuStore.isSaving"
          @click="handleDeleteMenu"
        />
      </template>
    </Dialog>
  </div>
</template>
