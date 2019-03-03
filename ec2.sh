# ---------------------
# @AmazonEC2 instance
# ---------------------

sudo su
cd ..
rm -rf Pudding
git clone https://github.com/DivySrivastava/Pudding.git
cd Pudding
npm i 
service stop node
node server.js &