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

// GET - 获取图片访问URL
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: '缺少图片key参数' }, { status: 400 });
    }

    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: 86400 * 30, // 30天有效期
    });

    return NextResponse.json({ data: { url } });
  } catch (error) {
    console.error('获取图片URL失败:', error);
    return NextResponse.json({ error: '获取图片URL失败' }, { status: 500 });
  }
}
