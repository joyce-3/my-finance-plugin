document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeFinancialTables
  }, (results) => {
    if (results && results[0].result) {
      const data = results[0].result;
      if (data.length > 0) {
        downloadCSV(data[0].content); // 默认下载识别到的第一个表
        document.getElementById('status').innerText = `成功提取 ${data.length} 张表格！`;
      } else {
        document.getElementById('status').innerText = "未发现匹配的财务表格";
      }
    }
  });
});

// 数据清洗逻辑：处理财务格式
function cleanFinanceData(text) {
  let clean = text.trim().replace(/,/g, ''); // 移除千分位逗号
  // 处理括号负数 (123.45) -> -123.45
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = '-' + clean.substring(1, clean.length - 1);
  }
  return clean;
}

function scrapeFinancialTables() {
  const keywords = ["资产", "负债", "利润", "营收", "Equity", "Balance Sheet", "Income"];
  const tables = Array.from(document.querySelectorAll('table'));
  
  const found = tables.filter(t => keywords.some(key => t.innerText.includes(key)));
  
  return found.map(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const content = rows.map(row => 
      Array.from(row.querySelectorAll('td, th')).map(cell => {
        // 这里调用简单的清洗逻辑（由于作用域限制，直接在内层写简单逻辑）
        let val = cell.innerText.trim().replace(/,/g, '');
        if (val.startsWith('(') && val.endsWith(')')) val = '-' + val.substring(1, val.length - 1);
        return `"${val}"`; // 加引号防止CSV因逗号错位
      })
    );
    return { content };
  });
}

function downloadCSV(contentRows) {
  const csvContent = contentRows.map(row => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Financial_Data_${new Date().getTime()}.csv`;
  a.click();
}