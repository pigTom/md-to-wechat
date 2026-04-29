export type Theme = {
  id: string
  name: string
  accentColor: string
  styles: Record<string, string>   // tagName → CSS inline style string
  hljs: Record<string, string>     // hljs class name (e.g. 'hljs-keyword') → color value
}

import { wechatGreen } from './wechat-green'
import { techBlue } from './tech-blue'
import { warm } from './warm'
import { rose } from './rose'

export const themes: Theme[] = [wechatGreen, techBlue, warm, rose]
export const defaultTheme = wechatGreen
