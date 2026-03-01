// 在插件里引入 PDF.js
// manifest.json 里加：
// "content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }

import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js');

async function extractTablesFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const allPageTables = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // 每个 item 有 str（文字）和 transform（位置矩阵）
    const items = textContent.items.map(item => ({
      text: item.str.trim(),
      x: Math.round(item.transform[4]),        // x 坐标
      y: Math.round(item.transform[5]),         // y 坐标
      width: Math.round(item.width),
      height: Math.round(item.height),
    })).filter(item => item.text !== '');
    
    // 核心算法：用坐标聚类还原行列
    const tables = reconstructTables(items);
    allPageTables.push({ page: pageNum, tables });
  }
  
  return allPageTables;
}

function reconstructTables(items) {
  if (items.length === 0) return [];
  
  // ① 按 Y 坐标分组 → 识别"行"
  // 同一行的文字 Y 坐标差在 5px 以内
  const ROW_TOLERANCE = 5;
  const COL_TOLERANCE = 20;
  
  const rowGroups = [];
  const sortedByY = [...items].sort((a, b) => b.y - a.y); // PDF y轴从下往上，所以倒序
  
  sortedByY.forEach(item => {
    const existingRow = rowGroups.find(row => 
      Math.abs(row.y - item.y) <= ROW_TOLERANCE
    );
    if (existingRow) {
      existingRow.items.push(item);
    } else {
      rowGroups.push({ y: item.y, items: [item] });
    }
  });
  
  // 过滤掉只有1个元素的行（很可能是标题/正文，不是表格）
  const tableRows = rowGroups
    .filter(row => row.items.length >= 2)
    .sort((a, b) => b.y - a.y); // 按页面从上到下排列
  
  if (tableRows.length < 2) return [];
  
  // ② 按 X 坐标聚类 → 识别"列"
  // 收集所有出现过的 x 坐标，聚类成列
  const allXPositions = tableRows.flatMap(row => row.items.map(item => item.x));
  const columns = clusterXPositions(allXPositions, COL_TOLERANCE);
  
  // ③ 把每个文字分配到对应的列
  const matrix = tableRows.map(row => {
    const rowData = new Array(columns.length).fill('');
    row.items.forEach(item => {
      // 找最近的列
      const colIndex = columns.reduce((nearest, col, idx) => 
        Math.abs(col - item.x) < Math.abs(columns[nearest] - item.x) ? idx : nearest
      , 0);
      // 同一格有多个词就拼接（处理换行拆分的情况）
      rowData[colIndex] = rowData[colIndex] 
        ? rowData[colIndex] + ' ' + item.text 
        : item.text;
    });
    return rowData;
  });
  
  // ④ 判断是否是财务表格
  const fullText = matrix.flat().join(' ');
  const financeKeywords = ["Revenue", "Income", "Assets", "Liabilities", "Cash", "资产", "负债", "收入"];
  const isFinancial = financeKeywords.some(k => fullText.includes(k));
  
  if (!isFinancial && matrix.length < 4) return []; // 过滤非财务小表
  
  return [{ matrix, rowCount: matrix.length, colCount: columns.length }];
}

// X坐标聚类：把相近的x值合并成一个"列位置"
function clusterXPositions(xPositions, tolerance) {
  const sorted = [...new Set(xPositions)].sort((a, b) => a - b);
  const clusters = [];
  
  sorted.forEach(x => {
    const cluster = clusters.find(c => Math.abs(c - x) <= tolerance);
    if (!cluster) clusters.push(x);
  });
  
  return clusters;
}
