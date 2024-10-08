// The contents of this file were copied from the link below (credit to theotrain):
// https://github.com/theotrain/load-google-sheet-data-using-sql/blob/main/getSheetData.js

// The original code was modified slightly to fit with the specific use case

export function getSheetData({ sheetID, sheetName, query, callback }){
    const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?`;
    const url = `${base}&sheet=${encodeURIComponent(
      sheetName
    )}&tq=${encodeURIComponent(query)}`;
  
    fetch(url)
      .then((res) => res.text())
      .then((response) => {
        callback(responseToObjects(response));
      });
  
    function responseToObjects(res) {
        // credit to Laurence Svekis https://www.udemy.com/course/sheet-data-ajax/
        const jsData = JSON.parse(res.substring(47).slice(0, -2));
        let data = [];
        const columns = jsData.table.cols;
        const rows = jsData.table.rows;
        let rowObject;
        let cellData;
        let propName;
        for (let r = 0, rowMax = rows.length; r < rowMax; r++) {
            if(rows[r]["c"][9] === null)
                continue;
            rowObject = { index: r+2 }; 
            for (let c = 0, colMax = columns.length; c < colMax; c++) {
                cellData = rows[r]["c"][c];
                propName = columns[c].label;
                if (cellData === null) {
                    rowObject[propName] = "";
                } 
                else if (typeof cellData["v"] == "string" &&
                    cellData["v"].startsWith("Date")) 
                {
                    rowObject[propName] = cellData["f"];
                } else {
                    rowObject[propName] = cellData["v"];
                }
            }
            data.push(rowObject);
        }

        return data;
    }
};