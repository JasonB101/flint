function createEbayListingTemplate(title, partNo, itemSpecifics) {
    //ItemSpecifics is a javascript string with \n
    //That is then converted into html with multiple p tags, one for each line.
    const itemSpecsArray = itemSpecifics.split("\n");
    itemSpecsArray.forEach(x => x = `<p>${x}</p>`);
    const itemSpecs = itemSpecsArray.join("<br>");
    const returnPolicyDays = 30;

    const html = `<div style="text-align: center; width: 900px; max-width: 900px; border: 3px solid rgb(0, 0, 255); height: 810px; margin: 0px auto; padding: 0px; border-radius: 15px; font-size: 16px;"><div style="line-height: 50px; height: 64px; text-align: center; border-bottom: 1px solid rgb(16, 16, 16); border-top-left-radius: 12px; border-top-right-radius: 12px; background-color: rgb(0, 128, 255); width: 900px;"><span style="font-size: 18px; font-weight: bold; color: #ffffff; text-shadow: #000000 1px 1px 2px;">${title}</span></div>
<div style="padding: 8px; width: 875px; height: 593px;"><span style="font-size: 22px; font-weight: 700; text-decoration-line: underline;">Item Specifics<br>
</span><br>
<span style="font-weight: bold;"><span style="font-size:18px;">Part Number: ${partNo}</span><br>
<div style="text-align: center;">${itemSpecs}</div>
<br>
<br>
<span style="font-size: 22px; font-weight: 700; text-decoration-line: underline;">Return Policy</span><br>
<br>
<div style="text-align: center;"><span style="font-weight: bold;">${returnPolicyDays} Day return policy.</span> If you are unsatisfied with your order, feel free to send it right back. After an inspection of the item to be sure it is the exact same part that was sold, a full refund will be issued. Buyer pays return shipping. <span style="font-weight: bold;">No restocking fees.</span></div>
<br>
<br>
<span style="font-size: 24px; text-align: left; font-weight: bold;">Fast and Free Shipping!</span><span style="font-size: 24px; text-align: left;"></span>
<div style="text-align: left; width: 880px; height: 153px; font-size: 16px;"><img src="https://down-yuantu.pngtree.com/original_origin_pic/18/08/26/554ca7fca33d42f4f9a0816b684bd66d.png?e=1589906352&st=NDI2NmNhZDhiNmZmOWE0ZDNiNjkyODcyMGMxMmZmNWI&n=%E2%80%94Pngtree%E2%80%94express%20logistics%20send%20courier%20brother_3850325.png" style="height: 150px; vertical-align: middle; float: left; margin: 30px;"><br style="font-weight: bold;">
<ul style="">
<li style="">Shipped with USPS Priority Mail.</li>
<li style="">Arrives within 1 - 3 business days.</li>
<li style="">Packaged securely to ensure no damage occurs during shipping.<br>
</li>
<li>Ships within 24 hours.</li>
<li style="">If ordered before 4pm Mountain Time, I will try to ship same day. (No guarantee)</li>
</ul>
</div>
</div>
<div style="height: 135px; text-align: center; border-top: 1px solid rgb(16, 16, 16); border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; background-color: rgb(0, 128, 255); width: 900px; font-size: 10px;"><br>
&nbsp;<span style="font-size: 30px; font-weight: 700; "><span style="color: rgb(255, 255, 255);">Please Read!</span><br>
</span><span style="color: rgb(255, 255, 255);"><span style="font-size:18px;">If you are dissatisfied&nbsp;at any point during the purchase or transaction of your order, please message me before leaving negative feedback. I strive to make sure each and everyone of my customers are treated fairly. Concerns and issues are quickly dealt with.</span></span></div>
</div>`

return html;
}

module.exports = createEbayListingTemplate;