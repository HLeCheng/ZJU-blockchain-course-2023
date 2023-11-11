// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment the line to use openzeppelin/ERC721
// You can use this dependency directly because it has been installed by TA already
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./MyERC20.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol"; //

contract BorrowYourCar is ERC721{

    // use a event if you want
    // to represent time you can choose block.timestamp
    event CarBorrowed(uint256 carcarId, address borrower, uint256 startTime, uint256 duration);

    // maybe you need a struct to store car information
    struct Car {
        address owner;
        address borrower;
        uint256 borrowUntil;
    }

    uint256 private nextId = 0; // carId

    mapping(uint256 => Car) public cars; // A map from car index to its information
    mapping(address => uint256[]) private OwnedCars; // A map from car owner to its cars

    uint256[] public UnborrowedCars;

    uint256[] public BorrowedCars;

    MyERC20 public myERC20;


    constructor() ERC721("LaoHeCoin", "LaoHeCoin"){
        myERC20 = new MyERC20("LaoHeCoin", "LaoHeCoin");
    }

    function carInput() external{
        _safeMint(msg.sender, nextId);
        cars[nextId] = Car(msg.sender, address(0), 0);
        OwnedCars[msg.sender].push(nextId);
        UnborrowedCars.push(nextId);
        nextId++;
    }

    function getMyCars() external view returns (uint256[] memory) {
        return OwnedCars[msg.sender];
    }

    function getUnborrowCars() external view returns (uint256[] memory) {
        return UnborrowedCars;
    }

    function getCarOwner(uint256 carId) public view returns(address){
        require(carId < nextId, "This car doesn't exist");
        Car storage car =  cars[carId];
        return car.owner;
    }

    function getCarBorrower(uint256 carId) public view returns(address){
        if( uint256(cars[carId].borrowUntil) >=  block.timestamp){
            return  cars[carId].borrower;
        }
        else{
            return address(0);
        }
    }

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


    function remove(uint256[] storage array, uint256 value) internal {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == value) {
                array[i] = array[array.length - 1];
                array.pop(); break;
            }
        }
    }

    function check() external  {
        for (uint i = 0; i < BorrowedCars.length; i++) {
            if (uint256(cars[BorrowedCars[i]].borrowUntil) < block.timestamp) {
                UnborrowedCars.push(BorrowedCars[i]);
                remove(BorrowedCars, BorrowedCars[i]);
            }
        }
    }

}