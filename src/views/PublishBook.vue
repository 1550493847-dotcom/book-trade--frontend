<template>
  <div class="publish-container">
    <el-card class="publish-card">
      <template #header>
        <span class="title">发布二手书</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="书名" prop="title">
          <el-input v-model="form.title" placeholder="请输入书名" />
        </el-form-item>

        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" placeholder="请输入作者" />
        </el-form-item>

        <el-form-item label="ISBN">
          <el-input v-model="form.isbn" placeholder="请输入ISBN编号" />
        </el-form-item>

        <el-form-item label="出版社">
          <el-input v-model="form.publisher" placeholder="请输入出版社" />
        </el-form-item>

        <el-form-item label="成色">
          <el-select v-model="form.bookCondition" placeholder="请选择成色">
            <el-option label="全新" value="全新" />
            <el-option label="九成新" value="九成新" />
            <el-option label="八成新" value="八成新" />
            <el-option label="七成新" value="七成新" />
            <el-option label="五成新及以下" value="五成新及以下" />
          </el-select>
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="计算机" value="计算机" />
            <el-option label="文学" value="文学" />
            <el-option label="外语" value="外语" />
            <el-option label="考试" value="考试" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="原价" prop="originalPrice">
          <el-input-number v-model="form.originalPrice" :min="0" :precision="2" />
        </el-form-item>

        <el-form-item label="售价" prop="sellPrice">
          <el-input-number v-model="form.sellPrice" :min="0" :precision="2" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>

        <!-- 图片上传区域 -->
      <el-form-item label="商品图片" prop="images">
  <el-upload
    :http-request="customUpload"
    :show-file-list="true"
    list-type="picture-card"
    :limit="3"
    :on-remove="handleRemove"
  >
    <el-icon><Plus /></el-icon>
  </el-upload>
  <div class="upload-tip">点击上传图片，支持jpg/png，单张不超过2MB</div>
</el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit" :loading="loading">发布</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import request from "@/api/request"

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  bookCondition: "",
  category: "",
  originalPrice: null,
  sellPrice: null,
  description: "",
  images: ""
})

const rules = {
  title: [{ required: true, message: "请输入书名", trigger: "blur" }],
  sellPrice: [{ required: true, message: "请输入售价", trigger: "blur" }]
}

// 自定义上传方法
const customUpload = async (options) => {
  const file = options.file
  
  // 校验文件类型
  const isImage = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/jpg"
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error("只能上传 JPG/PNG 格式的图片!")
    return false
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 2MB!")
    return false
  }
  
  // 创建 FormData 对象
  const formData = new FormData()
  formData.append("file", file)
  
  try {
    const res = await request.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
    
    if (res.code === 200) {
      // 拼接图片URL
      const imageUrl = res.data
      if (form.images) {
        form.images = form.images + "," + imageUrl
      } else {
        form.images = imageUrl
      }
      ElMessage.success("图片上传成功")
      options.onSuccess()
    } else {
      ElMessage.error("上传失败")
      options.onError()
    }
  } catch (error) {
    console.error("上传错误:", error)
    ElMessage.error("上传失败，请重试")
    options.onError()
  }
}

// 移除图片
const handleRemove = (file, fileList) => {
  // 重新构建 images 字符串
  const urls = []
  fileList.forEach(item => {
    if (item.response && item.response.data) {
      urls.push(item.response.data)
    }
  })
  form.images = urls.join(",")
}

// 发布商品
const submit = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const submitData = {
      title: form.title,
      author: form.author,
      isbn: form.isbn || null,
      publisher: form.publisher || null,
      bookCondition: form.bookCondition || null,
      category: form.category,
      originalPrice: form.originalPrice,
      sellPrice: form.sellPrice,
      description: form.description,
      images: form.images
    }

    const res = await request.post("/api/book/publish", submitData)
    
    if (res.code === 200) {
      ElMessage.success("发布成功！")
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } else {
      ElMessage.error(res.message || "发布失败")
    }
  } catch (error) {
    ElMessage.error("发布失败，请重试")
    console.error("发布错误:", error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formRef.value.resetFields()
  form.images = ""
}
</script>

<style scoped>
.publish-container {
  display: flex;
  justify-content: center;
  padding: 40px;
}
.publish-card {
  width: 650px;
}
.title {
  font-size: 20px;
  font-weight: bold;
}
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .publish-container { padding: 12px; }
  .publish-container .el-form-item { margin-bottom: 14px; }
}
</style>
