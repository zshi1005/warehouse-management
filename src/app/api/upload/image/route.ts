import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// POST - 上传图片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '只支持 JPG、PNG、GIF、WEBP 格式的图片' }, { status: 400 });
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // 上传到对象存储
    const imageKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成访问URL
    const imageUrl = await storage.generatePresignedUrl({
      key: imageKey,
      expireTime: 86400 * 30, // 30天有效期
    });

    return NextResponse.json({ 
      data: { 
        key: imageKey, 
        url: imageUrl 
      } 
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    return NextResponse.json({ error: '上传图片失败' }, { status: 500 });
  }
}
