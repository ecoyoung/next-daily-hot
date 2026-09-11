/*
 * @Description: 自适应抓取间隔观测（调试用）
 */
import { adaptiveSnapshot } from '@/lib/request'

export async function GET() {
  return Response.json({
    code: 200,
    msg: '请求成功',
    data: adaptiveSnapshot(),
    timestamp: Date.now(),
  })
}
