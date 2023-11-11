import {Button} from 'antd';
import {Header} from "../../asset";
import {useEffect, useState} from 'react';
import {borrowYourCarContract, myERC20Contract, web3} from "../../utils/contracts";
import './index.css';
import React from 'react';

const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'

const CarBorrowPage = () => {

    //保存账户和余额
    const [account, setAccount] = useState('')
    const [accountBalance, setAccountBalance] = useState(0)
    //保存用户查询车的ID,借车的ID以及时间time
    const [queryId, setqueryId] = useState('');
    const [borrowCarId, setBorrowCarId] = useState('');
    const [time, setTime] = useState('');
    //保存用户拥有的车辆以及所有未被借用的车辆
    const [myCars, setMyCars] = useState<Car[]>([]);
    const [UnborrowedCars, setUnborrowedCars] = useState<Car[]>([]);
    //设置查询flag, flag=1代表用户查询自己拥有的车辆, flag=2代表查询空闲车辆
    const [queryflag, setflag] = useState(0)


    //车辆信息结构体
    class Car {
        constructor(public CarID: number) {}
    }

    const images = [
        require('../../asset/image/0.jpg'),
        require('../../asset/image/1.jpg'),
        require('../../asset/image/2.jpg'),
        require('../../asset/image/3.jpg'),
        require('../../asset/image/4.jpg'),
        require('../../asset/image/5.jpg'),
        require('../../asset/image/6.jpg'),
        require('../../asset/image/7.jpg'),
        require('../../asset/image/8.jpg'),
    ]

    useEffect(() => {
        //初始化尝试获取用户账户
        const initCheckAccounts = async () => {
            // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
            // @ts-ignore
            const {ethereum} = window;
            // 尝试获取连接的用户账户
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                const accounts = await web3.eth.getAccounts()
                if(accounts && accounts.length) {
                    setAccount(accounts[0])
                }
            }
        }
        initCheckAccounts()

    }, [])


    useEffect(() => {
        //监听用户账户变化，当账户变化时更新对应信息
        const getInfo = async () => {
            if (myERC20Contract) {
                //获取用户余额
                const ab = await myERC20Contract.methods.balanceOf(account).call()
                setAccountBalance(ab)

            } else {
                alert('合约不存在')
            }
        }

        if(account !== '') {
            getInfo()
        }
    }, [account])

    const GetMyCars = async () => {
        if(account === '') {
            alert('请连接钱包.')
            return
        }
        if (borrowYourCarContract) {
            try {
                let ownerCars = await borrowYourCarContract.methods.getMyCars().call({
                    from: account,gas:''
                })
                const MyCars = ownerCars.map((carId: number) => new Car(carId));
                setMyCars(MyCars);
                setflag(1);
                alert('查询成功.')
            } catch (error: any) {
                alert(error.message)
            }

        } else {
            alert('合约不存在.')
        }
    }

    const getUnborrowCars = async () => {
        if(account === '') {
            alert('请连接钱包.')
            return
        }
        if (borrowYourCarContract) {
            try {
                let UnborrowedCars = await borrowYourCarContract.methods.getUnborrowCars().call({
                    from: account
                })
                const UnborrowCars = UnborrowedCars.map((carId: number) => new Car(carId));
                setUnborrowedCars(UnborrowCars);
                setflag(2);
                alert('查询成功.')
            } catch (error: any) {
                alert(error.message)
            }

        } else {
            alert('合约不存在.')
        }
    }

    const onClaimTokenAirdrop = async () => {
        if(account === '') {
            alert('请连接钱包.')
            return
        }
        if (myERC20Contract) {
            try {
                await myERC20Contract.methods.airdrop().send({
                    from: account, gas: 6721975
                })
                alert('成功获取老和币.')
            } catch (error: any) {
                alert(error.message)
            }

        } else {
            alert('合约不存在')
        }
    }

    const borrowCar = async () => {

        if (account === '') {
            alert('请连接钱包.')
            return
        }
        if(!borrowCarId){
            alert('请输入车辆id.')
            return
        }
        if(!time){
            alert('请输入租用时间.')
            return
        }

        if (borrowYourCarContract&&myERC20Contract) {
            try {
                //向合约授权租赁费用
                await myERC20Contract.methods.approve(borrowYourCarContract.options.address,time).send({
                    from: account, gas: 6721975
                })
                //借用车辆
                await borrowYourCarContract.methods.borrowCar(borrowCarId, parseInt(time)*60).send({
                    from: account, gas: 6721975
                })
                alert('借用成功.')
            } catch (error: any) {
                alert(error.message)
                console.log(error.message)
            }
        } else {
            alert('合约不存在.')
        }
    }

    const queryCar = async () => {

        if (account === '') {
            alert('请连接钱包.')
            return
        }
        if(!queryId){
            alert('请输入车辆id.')
            return
        }
        if (borrowYourCarContract) {
            try {
                //查询车辆信息
                const owner =  await borrowYourCarContract.methods.getCarOwner(queryId).call()
                const borrower =  await borrowYourCarContract.methods.getCarBorrower(queryId).call()
                //输出查询结果
                if(owner === '0x0000000000000000000000000000000000000000'){
                    alert('该车辆不存在,请输入正确ID')
                }else if(borrower === '0x0000000000000000000000000000000000000000'){
                    alert('车辆ID：' + queryId + '\n车主是：' + owner + '\n该车辆当前空闲')
                }else{
                    alert('车辆ID：' + queryId + '\n车主是：' + owner + '\n借用者是：' + borrower)
                }
            } catch (error: any) {
                alert(error.message)
            }
        } else {
            alert('合约不存在.')
        }
    }


    const carInput = async () => {
        if(account === '') {
            alert('请连接钱包.')
            return
        }
        if (borrowYourCarContract && myERC20Contract) {
            try {
                // 获取一辆新车
                await borrowYourCarContract.methods.carInput().send({
                    from: account, gas: 6721975
                })
                alert('成功获取新的车辆.')
            } catch (error: any) {
                alert(error.message)
            }
        } else {
            alert('合约不存在')
        }
    }
    const update = async () => {
        if(account === '') {
            alert('请连接钱包.')
            return
        }
        if (borrowYourCarContract && myERC20Contract) {
            try {
                // 更新车辆信息
                await borrowYourCarContract.methods.check().send({
                    from: account, gas: 6721975
                })
                alert('更新信息成功.')
            } catch (error: any) {
                alert(error.message)
            }
        } else {
            alert('合约不存在')
        }
    }

    const onClickConnectWallet = async () => {
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        // @ts-ignore
        const {ethereum} = window;
        if (!Boolean(ethereum && ethereum.isMetaMask)) {
            alert('未安装MetaMask插件.')
            return
        }
        try {
            // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
            if (ethereum.chainId !== GanacheTestChainId) {
                const chain = {
                    chainId: GanacheTestChainId, // Chain-ID
                    chainName: GanacheTestChainName, // Chain-Name
                    rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
                };
                try {
                    // 尝试切换到本地网络
                    await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: chain.chainId}]})
                } catch (switchError: any) {
                    // 如果本地网络没有添加到Metamask中，添加该网络
                    if (switchError.code === 4902) {
                        await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain]
                        });
                    }
                }
            }
            // 小狐狸成功切换网络了，接下来让小狐狸请求用户的授权
            await ethereum.request({method: 'eth_requestAccounts'});
            // 获取小狐狸拿到的授权用户列表
            const accounts = await ethereum.request({method: 'eth_accounts'});
            // 如果用户存在，展示其account，否则显示错误信息
            setAccount(accounts[0] || 'Not able to get accounts');
        } catch (error: any) {
            alert(error.message)
        }
    }

    function Display(carList: Car[], title: string) {
        return (
            <>
                <h3>{title}</h3>
                {carList.length !== 0 && (
                    <table>
                        <thead>
                        <tr>
                            <th>CarID</th>
                            <th>Image</th>
                        </tr>
                        </thead>
                        <tbody>
                        {carList.map((car) => (
                            <tr key={car.CarID}>
                                <td className="car">{car.CarID}</td>
                                <td className="car">
                                    <img
                                        src={images[car.CarID % 9]}
                                        alt='Image'
                                        className='image'
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </>
        );
    }


    // @ts-ignore
    return (
        <>
            <div className='container'>
                <img
                    width='100%'
                    height='320px'
                    src={Header}
                    alt='Header Image'
                />
                <div className='main'>
                    <h1>汽车租赁系统</h1>
                    <div className='account'>
                        {account === '' && <Button onClick={onClickConnectWallet}>连接钱包</Button>}
                        <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                        <div>当前用户拥有老和币数量：{account === '' ? 0 : accountBalance}</div>
                    </div>
                    <div className='operation'>
                        <div style={{marginBottom: '20px'}}>操作栏</div>
                        <Button style={{width: '200px'}} onClick={onClaimTokenAirdrop}>领取老和币空投</Button>
                        <div className='buttons'>
                            {/*给用户增加测试用车，在实际使用时去除该功能*/}
                            <Button style={{width: '200px'}} onClick={carInput}>获取车辆</Button>
                            <Button style={{width: '200px'}} onClick={GetMyCars}>查看我的汽车</Button>
                            <Button style={{width: '200px'}} onClick={update}>更新可用车数据</Button>
                            <Button style={{width: '200px'}} onClick={getUnborrowCars}>查看可用车</Button>
                            {/*<span>租车费用 1老和币/秒</span>*/}
                            <div>
                                <span>车辆ID：</span>
                                <input type="number"style={{width:'70px',marginRight: '20px'}} value={queryId} onChange={e => setqueryId(e.target.value)} />
                                <Button style={{width: '150px'}} onClick={queryCar}>查询车辆信息</Button>
                            </div>
                            <div>
                                <span>车辆ID：</span>
                                <input type="number"style={{width:'50px',marginRight: '10px'}} value={borrowCarId} onChange={e => setBorrowCarId(e.target.value)} />
                                <span>借用时间：</span>
                                <input type="number"style={{width:'50px'}} value={time} onChange={e => setTime(e.target.value)} /> 分钟
                                <Button style={{width: '70px',marginLeft: '10px'}} onClick={borrowCar}>租借</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='queryresult'>
                <div>
                    {queryflag === 1 && Display(myCars, `我拥有的Car | ${myCars.length}辆`)}
                    {queryflag === 2 && Display(UnborrowedCars, `当前可借用的Car | ${UnborrowedCars.length}辆`)}
                </div>
            </div>
        </>
    )
}

export default CarBorrowPage