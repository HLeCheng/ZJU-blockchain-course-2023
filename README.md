# ZJU-blockchain-course-2023

⬆ 可以️修改成你自己的项目名。

> 第二次作业要求（以下内容提交时可以删除）：
> 
> 简易汽车借用系统，参与方包括：汽车拥有者，有借用汽车需求的用户
>
> 背景：ERC-4907 基于 ERC-721 做了简单的优化和补充，允许用户对NFT进行租借。
> - 创建一个合约，在合约中发行NFT集合，每个NFT代表一辆汽车。给部分用户测试领取部分汽车NFT，用于后面的测试。
> - 在网站中，默认每个用户的汽车都可以被借用。每个用户可以： 
>    1. 查看自己拥有的汽车列表。查看当前还没有被借用的汽车列表。
>    2. 查询一辆汽车的主人，以及该汽车当前的借用者（如果有）。
>    3. 选择并借用某辆还没有被借用的汽车一定时间。
>    4. 上述过程中借用不需要进行付费。
> 
> - （Bonus）使用自己发行的积分（ERC20）完成付费租赁汽车的流程
> - 请大家专注于功能实现，网站UI美观程度不纳入评分标准，但要让用户能够舒适操作。简便起见，可以在网上找图片代表不同汽车，不需要将图片在链上进行存储。

## 如何运行

补充如何完整运行你的应用。

1. 在本地启动ganache应用，端口：8545。

2. 在 `./contracts` 中安装需要的依赖，运行如下的命令：
    ```bash
    npm install
    ```

3. 复制ganache测试链上的账户到 `./contracts/hardhat.config.ts`下 

4. 在 `./contracts` 中编译合约，运行如下的命令：

    ```bash
    npx hardhat compile
    ```

5. 在 `./contracts` 中部署合约到ganache测试链上，运行如下的命令：

    `npx hardhat run ./scripts/deploy.ts --network ganache`

    将输出的合约部署地址填写到`./frontend/src/utils/contract-addresses.json`中

6. 复制`./contracts/artifacts/contracts/BorrowYourCar.sol/BorrowYourCar.json`和`./contracts/artifacts/contracts/QiushiToken.sol/QiushiToken.json`到`./frontend/src/utils/abis`中

7. 在 `./frontend` 中安装需要的依赖，运行如下的命令：
    ```bash
    npm install
    ```

8. 在 `./frontend` 中安装 `web3 v1.10.0` ，运行如下的命令：

    ```bash
    npm install web3@1.10.0
    ```

9. 在 `./frontend` 中安装 `antd` 依赖，运行如下的命令：

    ```bash
    npm install antd
    ```

10. 在 `./frontend` 中启动前端程序，运行如下的命令：

    ```bash
    npm run start
    ```

    

## 功能实现分析

1. **查看自己拥有的汽车列表，查看当前还没有被借用的汽车列表。**

   BorrowYourCar合约中维护两个映射

   ```solidity
   mapping(uint256 => Car) public cars;
   uint256[] public UnborrowedCars;
   ```

   利用两个function返回汽车列表

   ```solidity
   function getMyCars() external view returns (uint256[] memory) {
           return OwnedCars[msg.sender];
   }
   function getUnborrowCars() external view returns (uint256[] memory) {
       return UnborrowedCars;
   }
   ```

2. **查询一辆汽车的主人，以及该汽车当前的借用者(如果有)。**

   BorrowYourCar合约中利用两个function返回主人和借用者

   ```solidity
   function getCarOwner(uint256 carId) public view returns(address){
           require(carId < nextId, "This car doesn't exist");
           Car storage car =  cars[carId];
           return car.owner;
   }
   //需要先检测carId是否有效
   function getCarBorrower(uint256 carId) public view returns(address){
       if( uint256(cars[carId].borrowUntil) >=  block.timestamp){
           return  cars[carId].borrower;
       }
       else{
           return address(0);
       }
   }
   //需要检测借用时间是否超过
   ```

3. **选择并借用某辆还没有被租借的汽车一定时间。**

   - 检测carId，车辆状态等条件是否满足
   - 设置花费为1老和币/s，调用ERC20的transferFrom函数完成转账
   - 维护car数组，UnborrowedCars列表和BorrowedCars列表

   ```solidity
   function borrowCar(uint256 carId, uint256 sec) external {
   
       require(getCarOwner(carId) != msg.sender, "You can't borrow your own car");
       require(carId < nextId, "This car doesn't exist");
       require(block.timestamp > cars[carId].borrowUntil, "This car has been borrowed");
   
       uint256 cost = sec * 1;
   
       require(cost <= myERC20.balanceOf(msg.sender), "Insufficient balance");
   
       myERC20.transferFrom(msg.sender, getCarOwner(carId), cost);
   
       cars[carId].borrowUntil = sec + block.timestamp;
       cars[carId].borrower = msg.sender;
       remove(UnborrowedCars, carId);
       BorrowedCars.push(carId);
   
       emit CarBorrowed(carId, msg.sender, block.timestamp, sec);
   }
   ```

4. **使用自己发行的积分（ERC20）完成付费租赁汽车。**

   基于ERC20合约发行老和币

   ```solidity
   // SPDX-License-Identifier: UNLICENSED
   pragma solidity ^0.8.0;
   
   import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
   
   contract MyERC20 is ERC20 {
   
       mapping(address => bool) claimedAirdropList;
   
       constructor(string memory name, string memory symbol) ERC20(name, symbol) {
   
   	}
   	
       function airdrop() external {
               require(claimedAirdropList[msg.sender] == false, "This user has claimed airdrop already");
               _mint(msg.sender, 1000000);
               claimedAirdropList[msg.sender] = true;
       }
   }
   
   constructor() ERC721("LaoHeCoin", "LaoHeCoin"){
           myERC20 = new MyERC20("LaoHeCoin", "LaoHeCoin");
   }
   ```
   
   

## 项目运行截图

- 系统运行界面（未连接账户）

  <img src=".\screenshot\系统界面.png" alt="系统界面" style="zoom:50%;" />

- 连接账户

  <img src=".\screenshot\连接账户.png" alt="连接账户" style="zoom:50%;" />

- 领取空投，刷新后显示

  <img src=".\screenshot\领空投.png" alt="领空投" style="zoom:50%;" />

- 查看我的车

  <img src=".\screenshot\查看我的车.png" alt="查看我的车" style="zoom:50%;" />

  

  <img src=".\screenshot\展示我的车.png" alt="展示我的车" style="zoom:50%;" />

- 查看可借车

  <img src=".\screenshot\可借车列表.png" alt="可借车列表" style="zoom:50%;" />

- 查看某辆车的主人和借用者

  <img src=".\screenshot\查看车主及借用者.png" alt="查看车主及借用者" style="zoom:50%;" />

- 查看不存在的车

  <img src=".\screenshot\查看不存在的车.png" alt="查看不存在的车" style="zoom:50%;" />

- 租借自己的车，报错

  <img src=".\screenshot\租借自己车.png" alt="租借自己车" style="zoom:50%;" />

- 切换账户借车，用老和币付费

  <img src=".\screenshot\付费.png" alt="付费" style="zoom:50%;" />

  <img src=".\screenshot\成功借用.png" alt="成功借用" style="zoom:50%;" />

- 借用后再查看可借车列表，发现少了一辆车

  <img src=".\screenshot\借用后查看可借车.png" alt="借用后查看可借车" style="zoom:50%;" />

- 借用时间过后，更新可借车信息（新建交易区块用于更新block.timestamp)

  <img src=".\screenshot\更新可用车.png" alt="更新可用车" style="zoom:50%;" />

- 再次查看可借车列表，发现借用车已归还

  <img src=".\screenshot\更新后查看.png" alt="更新后查看" style="zoom:50%;" />

## 参考内容

- 课程的参考Demo见：[DEMOs](https://github.com/LBruyne/blockchain-course-demos)。

- ERC-4907 [参考实现](https://eips.ethereum.org/EIPS/eip-4907)

