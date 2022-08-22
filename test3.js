const createDate = (unEditedDateString) =>{
    const dateString = unEditedDateString.replace(' at', ',' )
    const testDate = new Date(dateString)
    console.log(`${testDate.toLocaleString()}`)
    return testDate.toLocaleString()
}

// createDate('Thursday, August 18, 2022, 4:00 PM')
createDate('Thursday, August 18, 2022 at 4:00 PM')

// Thursday, August 18, 2022 at 4:00 PM