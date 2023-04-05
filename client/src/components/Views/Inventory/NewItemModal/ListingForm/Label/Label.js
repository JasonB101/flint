import React, {useEffect} from "react"
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFViewer,
} from "@react-pdf/renderer";
// Create styles
const styles = StyleSheet.create({
    page: {
        backgroundColor: "white",
        color: "black",
    },
    text: {
        fontSize: 90,
        padding: 4,
        paddingRight: 70

    },
    section: {
        left: -20,
        paddingTop: 85,
        textAlign: "center",
    },
    viewer: {
        width: 0, //the pdf viewer will take up all of the width and height
        height: 0,
    },
});

// Create Document Component
function Label({labelInfo}) {
    let { sku, year, make, model } = labelInfo

    useEffect(() => {
        // window.frames['pdfView'].print()
    },[])
    return (
        <PDFViewer id="pdfView" name="pdfView" style={styles.viewer}>
            {/* Start of the document*/}
            <Document>
                {/*render a single page*/}
                <Page orientation="landscape" style={styles.page}>
                    <View style={styles.section}>
                        <Text style={styles.text}>{`${sku} \n ${year} ${model}`}</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
}
export default Label;


