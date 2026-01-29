import { defineStore } from 'pinia'
import { ref } from 'vue'
import { blogPostsApi, blogCategoriesApi } from '@/api/blog.api'
import type { BlogPost, BlogPostFormData, BlogCategory, BlogCategoryFormData } from '@/types/blog.types'

export const useBlogStore = defineStore('blog', () => {
  // State
  const posts = ref<BlogPost[]>([])
  const currentPost = ref<BlogPost | null>(null)
  const categories = ref<BlogCategory[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // === Posts Actions ===

  async function fetchPosts() {
    try {
      isLoading.value = true
      error.value = null
      const response = await blogPostsApi.getAll()
      if (response.success && response.data) {
        posts.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar entradas del blog'
      console.error('Error al cargar entradas del blog:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPostById(id: number): Promise<BlogPost | null> {
    try {
      isLoading.value = true
      error.value = null
      const response = await blogPostsApi.getById(id)
      if (response.success && response.data) {
        currentPost.value = response.data
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar la entrada'
      console.error('Error al cargar entrada del blog:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createPost(data: BlogPostFormData): Promise<BlogPost> {
    try {
      const response = await blogPostsApi.create(data)
      if (response.success && response.data) {
        await fetchPosts()
        return response.data
      }
      throw new Error(response.message || 'Error al crear la entrada')
    } catch (err: any) {
      console.error('Error al crear entrada del blog:', err)
      throw err
    }
  }

  async function updatePost(id: number, data: Partial<BlogPostFormData>): Promise<BlogPost> {
    try {
      const response = await blogPostsApi.update(id, data)
      if (response.success && response.data) {
        currentPost.value = response.data
        const index = posts.value.findIndex(p => p.id === id)
        if (index !== -1) {
          posts.value[index] = response.data
        }
        return response.data
      }
      throw new Error(response.message || 'Error al actualizar la entrada')
    } catch (err: any) {
      console.error('Error al actualizar entrada del blog:', err)
      throw err
    }
  }

  async function deletePost(id: number): Promise<void> {
    try {
      await blogPostsApi.delete(id)
      await fetchPosts()
    } catch (err: any) {
      console.error('Error al eliminar entrada del blog:', err)
      throw err
    }
  }

  async function togglePublished(id: number): Promise<void> {
    try {
      const response = await blogPostsApi.togglePublished(id)
      if (response.success && response.data) {
        const index = posts.value.findIndex(p => p.id === id)
        if (index !== -1) {
          posts.value[index] = response.data
        }
        if (currentPost.value?.id === id) {
          currentPost.value = response.data
        }
      }
    } catch (err: any) {
      console.error('Error al cambiar estado de publicación:', err)
      throw err
    }
  }

  // === Categories Actions ===

  async function fetchCategories() {
    try {
      const response = await blogCategoriesApi.getAll()
      if (response.success && response.data) {
        categories.value = response.data
      }
    } catch (err: any) {
      console.error('Error al cargar categorías del blog:', err)
    }
  }

  async function createCategory(data: BlogCategoryFormData): Promise<BlogCategory> {
    try {
      const response = await blogCategoriesApi.create(data)
      if (response.success && response.data) {
        await fetchCategories()
        return response.data
      }
      throw new Error(response.message || 'Error al crear la categoría')
    } catch (err: any) {
      console.error('Error al crear categoría:', err)
      throw err
    }
  }

  async function updateCategory(id: number, data: BlogCategoryFormData): Promise<BlogCategory> {
    try {
      const response = await blogCategoriesApi.update(id, data)
      if (response.success && response.data) {
        await fetchCategories()
        return response.data
      }
      throw new Error(response.message || 'Error al actualizar la categoría')
    } catch (err: any) {
      console.error('Error al actualizar categoría:', err)
      throw err
    }
  }

  async function deleteCategory(id: number): Promise<void> {
    try {
      await blogCategoriesApi.delete(id)
      await fetchCategories()
    } catch (err: any) {
      console.error('Error al eliminar categoría:', err)
      throw err
    }
  }

  return {
    posts,
    currentPost,
    categories,
    isLoading,
    error,
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    togglePublished,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
})
