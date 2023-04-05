
export function getLabelFromTitle(title) {
    let firstCharIndex = title.match('[a-zA-Z]').index
    let model = ""
    let year = ""

    let modelString = title.substr(firstCharIndex).trim()
    let modelArray = modelString.split(" ")
    if (modelArray.length > 1){
        model = modelArray[1]
    }

    let yearString = title.substr(0, firstCharIndex - 1).trim()
    if (yearString.length > 0){
        year = getYear(yearString)
    }

    return {
        year,
        model
    }
}

function getYear(yearString) {
    let yearArray = []
    let year = ""

    if (yearString.includes("-")) {
        let yearRange = yearString.replace("-", " ").split(" ").filter(x => x).sort()
        let max = yearRange[1]
        let min = yearRange[0]
        for (let i = max - 1; i > min; i--){
            yearRange.push(i.len > 0 ? String(i) : String(0)+String(i))
        }
        yearArray = yearRange.sort()
        // console.log(yearArray)
        //add missing years, sort, then map to remove chars
    } else {
        yearArray = yearString.split(" ")
    }
    yearArray = yearArray.map(x => {
        return x.length > 2 ? x.substr(x.length - 2) : x
    }).sort()
    yearArray = [...new Set(yearArray)].sort()

    let aLength = yearArray.length
    year = aLength > 0 ? aLength === 1 ?
        yearArray[0] : aLength === 2 ?
            yearArray[1] : aLength >= 3 ?
                yearArray[aLength - 2] : "" : ""

    return year
}