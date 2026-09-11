/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 腾讯视频-剧集热搜榜（POST 接口，移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（电视剧热搜榜卡片接口）
  const url = 'https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getCard?video_appid=3000010&vversion_platform=2'
  try {
    const resp = await fetchJson<any>(url, {
      method: 'POST',
      headers: {
        'Referer': 'https://v.qq.com/',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_params: {
          rank_channel_id: '100113',
          rank_name: 'HotSearch',
          rank_page_size: '30',
          tab_mvl_sub_mod_id: '792ac_19e77Sub_1b2',
          tab_name: '热搜榜',
          tab_type: 'hot_rank',
          tab_vl_data_src: 'f5200deb4596bbf3',
          page_id: 'scms_shake',
          page_type: 'scms_shake',
          source_key: '',
          tag_id: '',
          tag_type: '',
          new_mark_label_enabled: '1',
        },
        page_context: { page_index: '1' },
        flip_info: {
          page_strategy_id: '',
          page_module_id: '792ac_19e77',
          module_strategy_id: {},
          sub_module_id: '20251106065177',
          flip_params: {
            folding_screen_show_num: '',
            is_mvl: '1',
            mvl_strategy_info: '{"default_strategy_id":"06755800b45b49238582a6fa1ad0f5c5","default_version":"3836","hit_page_uuid":"b5080d97dc694a5fb50eb9e7c99326ac","hit_tab_info":null,"gray_status_info":null,"bypass_to_un_exp_id":""}',
            mvl_sub_mod_id: '20251106065177',
            pad_post_show_num: '',
            pad_pro_post_show_num: '',
            pad_pro_small_hor_pic_display_num: '',
            pad_small_hor_pic_display_num: '',
            page_id: 'scms_shake',
            page_num: '0',
            page_type: 'scms_shake',
            post_show_num: '',
            shake_size: '',
            small_hor_pic_display_num: '',
          },
        },
      }),
    })
    const cards = resp?.data?.card?.children_list?.list?.cards ?? []
    const result: HotListItem[] = cards.map((c: any) => ({
      id: c.params?.cid ?? c.id,
      title: c.params?.title,
      desc: c.params?.second_title || c.params?.rec_subtitle,
      hot: c.params?.item_score,
      url: `https://v.qq.com/search?searchTerm=${encodeURIComponent(c.params?.title ?? '')}`,
      mobileUrl: `https://m.v.qq.com/search?searchTerm=${encodeURIComponent(c.params?.title ?? '')}`,
    })).filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
