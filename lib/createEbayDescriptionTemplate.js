function createEbayDescriptionTemplate(
  title,
  partNo,
  description,
  shippingService,
  userDescriptionTemplate
) {
  //description is a javascript string with \n
  //That is then converted into html with multiple p tags, one for each line.
  const itemSpecsArray = description.split("\n")
  itemSpecsArray.forEach(
    (x) => (x = `<p style="text-align: center; width: 100%;">${x}</p>`)
  )
  const itemSpecs = itemSpecsArray.join("<br>")
  const returnPolicyDays = 30
  const shippingDays = shippingService === "USPSPriority" ? "1 - 3" : "2 - 5"
  const returnMessage =
    shippingService === "USPSPriority"
      ? "Using the Post Office Priority Mail Return Service, shipping will be free."
      : "Contact us for instructions on returning this item."
  const descriptionVariables = {
    title,
    partNo,
    itemSpecs,
    shippingService,
    returnPolicyDays,
    shippingDays,
    returnMessage,
  }

  // Replace placeholders in the template with actual values
  return userDescriptionTemplate.replace(/\${(.*?)}/g, (_, key) => {
    return descriptionVariables[key.trim()] || ""
  })

  const html = `<!doctype html>
<html lang="zxx">
<head>
</head>
<body class="vsc-initialized"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"></body>
</html>
<title>${title}</title>
<link href="https://dewiso.com/css/bootstrap.min.css" rel="stylesheet" />
<style type="text/css">.element{background:#283055}
</style>
<div class="element" style="border-left: 1px solid #283055; border-right: 1px solid #283055; border-top: 1px solid #283055; color: #fff; line-height: 45px">
<div class="container" style="padding: 40px 0 40px 0">
<div class="col-12 col-md-12">
<p style="text-align: center;"><span style="font-family:Trebuchet MS,Helvetica,sans-serif;"><span style="font-size:48px;">JJ Auto Part Supply</span></span></p>
<div style="display:flex;justify-content:center;"><span style="font-family:Trebuchet MS,Helvetica,sans-serif;text-align:center;margin:10px;cursor:pointer;">
<a href="https://feedback.ebay.com/ws/eBayISAPI.dll?ViewFeedback&amp;userid=jj-auto" style="cursor:pointer;text-decoration:none;"><img alt="feedback" class="mx-auto d-block img-fluid" src="https://i.postimg.cc/gkxvPNgZ/feedback-like-rating-svgrepo-com-1.png" style="height:50px;cursor:pointer;" />
<span style="color:#ffffff;">See Feedback</span></a></span> <span style="font-family:Trebuchet MS,Helvetica,sans-serif;text-align:center;margin:10px;cursor:pointer;"><a href="https://www.ebay.com/sch/jj-auto/m.html" style="cursor:pointer;text-decoration:none;">
<img alt="feedback" class="mx-auto d-block img-fluid" src="https://i.postimg.cc/N0XYX9QM/garage-svgrepo-com.png" style="height:50px;cursor:pointer;" /><span style="color:#ffffff;">See More Items</span></a></span></div>
</div>
</div>
</div>

<div style="background: #F4F6F7; border-left: 1px solid #283055; border-right: 1px solid #283055; color: #353535; ; line-height: 25px">
<div class="container" style="padding-bottom: 20px; padding-top: 50px">
<div class="row">
<div class="col-12 col-md-4" style="padding-bottom: 20px"><font face="Arial"><img alt="Product" class="mx-auto d-block img-fluid" src="https://dewiso.com/images/parcel.svg" style="width: 20%" title="Product" /></font>

<h2 style="color: #283055; text-align: center; line-height: 45px"><font face="Arial">Item</font></h2>

<p><font face="Arial">This item has been thoroughly cleaned and sanitized. It has gone through an inspection process to find obvious flaws or issues that will affect the functionality of the item. If an item has been electronically tested, it will be noted in the listing!</font></p>
</div>

<div class="col-12 col-md-4" style="padding-bottom: 20px"><font face="Arial"><img alt="Shipping" class="mx-auto d-block img-fluid" src="https://dewiso.com/images/shipped.svg" style="width: 20%" title="Shipping" /></font>

<h2 style="color: #283055; text-align: center; line-height: 45px"><font face="Arial">Shipping</font></h2>

<p><font face="Arial"><strong>Our shipping is fast and free!</strong> This item will ship with ${shippingService}, it will arrive at your destination in ${shippingDays} days.&nbsp;<strong>Ships within 24 business hours!</strong> Our items are packaged with common sense. You can expect your item to show up without damages. </font></p>
</div>

<div class="col-12 col-md-4" style="padding-bottom: 20px"><font face="Arial"><img alt="Returns" class="mx-auto d-block img-fluid" src="https://i.postimg.cc/dtF19kw7/alert-square-svgrepo-com.png" style="width: 20%" title="Returns" /></font>

<h2 style="color: #283055; text-align: center; line-height: 45px"><font face="Arial">Returns</font></h2>

<p><strong>${returnPolicyDays} day return policy</strong> and a 60 day warranty if something goes wrong. ${returnMessage} Items are inspected to ensure the returned item is the original.</p>
</div>
</div>
</div>
</div>

<div style="background: #FDFEFE; border-left: 1px solid #283055; border-right: 1px solid #283055; color: #353535; line-height: 25px">
<div class="container" style="border-top: 1px solid #F4F6F7; padding: 40px 0 40px 0">
<div class="col-12 col-md-12">
<h2 style="color: #283055; line-height: 45px"><span style="font-size:22px;"><span style="font-family:Verdana,Geneva,sans-serif;">${title}</span></span></h2>

<hr align="left" style="background: #283055; height: 1px; width: 10%" />
<p>P/N:&nbsp;<span style="font-size:18px;"><span style="font-family:Verdana,Geneva,sans-serif;">${
    partNo === "N/A" ? "No Part Number" : partNo
  }</span></span></p>

<p>${itemSpecs}</p>

<p>&nbsp;</p>

<p>Please examine pictures carefully to ensure you will be satisfied with the condition of the item, any scratches dents or blemishes will be made visible in the photos. Double check the part number and/or year range you are looking for to be sure this part is compatible with your vehicle.</p>

<p>Thank you!</p>
</div>
</div>
</div>

<div style="border-left: 1px solid #283055; border-right: 1px solid #283055; border-bottom: 1px solid #283055; color: #fff; line-height: 25px">
<div class="col-12 col-md-12 element">
<div class="container" style="padding: 20px 0 20px 0; font-size: 80%; text-align: center">
<p><font face="Arial">If you experience any problems, please contact us for a rapid response and solution for any issue that you may have.</font></p>
</div>
</div>
</div>`

  return html
}

module.exports = createEbayDescriptionTemplate
