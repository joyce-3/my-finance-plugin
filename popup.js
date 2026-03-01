
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

function scrapeFinancialTables() {
  const tables = Array.from(document.querySelectorAll('table'));
  
  return tables.map(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const content = rows.map(row => {
      let cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
      
      // --- 关键逻辑：修复括号拆分问题 ---
      let cleanedRow = [];
      for (let i = 0; i < cells.length; i++) {
        let val = cells[i].replace(/,/g, ''); // 移除千分位
        
        // 如果当前格是 "("，且下一格有内容，尝试合并
        if (val === "(" && i + 1 < cells.length) {
          let nextVal = cells[i+1].replace(/,/g, '');
          // 检查再下一格是不是 ")"
          if (i + 2 < cells.length && cells[i+2] === ")") {
            cleanedRow.push(`"-${nextVal}"`); // 合并为负数
            i += 2; // 跳过后面两格
            continue;
          }
        }
        
        // 处理自带括号的情况 (123)
        if (val.startsWith('(') && val.endsWith(')')) {
          val = '-' + val.substring(1, val.length - 1);
        }
        
        cleanedRow.push(`"${val}"`);
      }
      return cleanedRow;
    });
    
    // 尝试找表格标题
    let tableName = table.previousElementSibling?.innerText?.split('\n')[0] || "Table";
    return { tableName, content };
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


/*

function scrapeFinancialTables() {

  function cleanCell(raw) {
    let val = raw.trim().replace(/,/g, '');
    if (/^\([\d.]+\)$/.test(val)) {
      val = '-' + val.slice(1, -1);
    }
    return '"' + val.replace(/"/g, '""') + '"';
  }

  const tables = Array.from(document.querySelectorAll('table'));

  return tables.map(table => {
    const rows = Array.from(table.querySelectorAll('tr'));

    const content = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.innerText.trim());
      const cleaned = [];

     for (let i = 0; i < cells.length; i++) {
  const val = cells[i].replace(/,/g, '').trim();

  // 跳过单独的 ( 或 ) 残留格
  if (val === '(' || val === ')') continue;

  // 情况1：三格分离 → ( | 89715 | )
  if (val === '(' && i + 2 < cells.length && cells[i + 2].trim() === ')') {
    cleaned.push(`"-${cells[i + 1].replace(/,/g, '')}"`);
    i += 2;
    continue;
  }

  // 情况2：左括号和数字在一起 → (89715 后面跟着 )
  if (val.startsWith('(') && !val.endsWith(')')) {
    cleaned.push(`"-${val.slice(1).replace(/,/g, '')}"`);
    continue; // 不管后面的 ) 在哪，直接跳过不处理
  }

  // 情况3：整体在一格 → (89715)
  if (/^\([\d.]+\)$/.test(val)) {
    cleaned.push(`"-${val.slice(1, -1)}"`);
    continue;
  }

  cleaned.push(cleanCell(cells[i]));
}
      
      return cleaned;
    });

    const tableName =
      table.previousElementSibling?.innerText?.split('\n')[0]?.trim()
      || table.querySelector('caption')?.innerText?.trim()
      || `Table_${Date.now()}`;

    return { tableName, content };
  });
}

*/
