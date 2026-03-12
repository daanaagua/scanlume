export const SIMPLE_PROMPT =
  "请做 simple OCR，提取图片中的所有主要可见文字。只返回纯文本，保留基本换行，不要解释，不要补充图片中没有的内容。";

export const FORMATTED_SYSTEM_PROMPT =
  "你是一个轻量 OCR 结构化助手。请只提取图片中真实可见的主要文字，保持主要阅读顺序，不要补充图片中没有的内容。";

export const FORMATTED_PROMPT =
  "请把这张截图转换成轻量的 formatted text。只保留主要可见文字与大致层级。同一视觉块中的连续文本可以合并。输出 blocks 数组，type 只允许 h1、h2、p、br，order 从上到下递增。";
