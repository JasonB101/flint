
function createEbayListingTemplate(title, partNo, itemSpecifics) {
    //ItemSpecifics is a javascript string with \n
    //That is then converted into html with multiple p tags, one for each line.
    const itemSpecsArray = itemSpecifics.split("\n");
    itemSpecsArray.forEach(x => x = `<p style="text-align: center; width: 100%;">${x}</p>`);
    const itemSpecs = itemSpecsArray.join("<br>");
    const returnPolicyDays = 30;

    const html = `<div style="text-align: center; width: 900px; max-width: 900px; border: 3px solid #00509d; margin: 0px auto; padding: 0px; border-radius: 15px; font-size: 16px;"><div style="line-height: 50px; height: 64px; text-align: center; border-bottom: 1px solid rgb(16, 16, 16); border-top-left-radius: 12px; border-top-right-radius: 12px; background-color: #00509d; width: 900px;"><span style="font-size: 18px; font-weight: bold; color: #ffffff; text-shadow: #000000 1px 1px 2px;">${title}</span></div>
<div style="padding: 8px; width: 875px; height: 593px;"><span style="font-size: 22px; font-weight: 700; text-decoration-line: underline;">Item Specifics<br>
</span><br>
<span style="font-weight: bold;"><span style="font-size:18px;">Part Number: ${partNo}</span><br>
<div style="text-align: center;">${itemSpecs}
<p style="text-align: center; width: 100%;">Please examine pictures carefully to ensure you will be satisfied with the condition of the item.</p>
<p style="text-align: center; width: 100%;">Thank you!</p>
</div>
<br>
<br>
<span style="font-size: 22px; font-weight: 700; text-decoration-line: underline;">Return Policy</span><br>
<br>
<div style="text-align: center;"><span style="font-weight: bold;">${returnPolicyDays} Day return policy.</span> If you are unsatisfied with your order, feel free to send it right back. After an inspection of the item to be sure it is the exact same part that was sold, a full refund will be issued. (All parts are marked for verification) Buyer pays return shipping. <span style="font-weight: bold;">No restocking fees.</span></div>
<br>
<br>
<span style="font-size: 24px; text-align: left; font-weight: bold;">Fast and Free Shipping!</span><span style="font-size: 24px; text-align: left;"></span>
<div style="text-align: left; width: 880px; height: 153px; font-size: 16px;"><img src="https://i.ibb.co/Qf70S9h/shipping-box.png" style="height: 150px; vertical-align: middle; float: left; margin: 30px;"><br style="font-weight: bold;">
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
<div style="height: 135px; text-align: center; border-top: 1px solid rgb(16, 16, 16); border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; background-color: #00509d; width: 900px; font-size: 10px;"><br>
&nbsp;<span style="font-size: 30px; font-weight: 700; "><span style="color: rgb(255, 255, 255);">Please Read!</span><br>
</span><span style="color: rgb(255, 255, 255);"><span style="font-size:18px;">If you are dissatisfied&nbsp;at any point during the purchase or transaction of your order, please message me before leaving negative feedback. I strive to make sure each and every one of my customers are treated fairly. Concerns and issues are quickly dealt with.</span></span></div>
</div>`

return html;
}

module.exports = createEbayListingTemplate;
