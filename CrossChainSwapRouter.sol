// SPDX-License-Identifier: MIT
// @credits : Salman Haider

pragma solidity 0.8.15;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract CrossChainSwapRouter{
    address _1inchRouterAddress;
    constructor(address _1inchRouterAdderss_) {
        _1inchRouterAddress=_1inchRouterAdderss_;
    }
    function swap(address srcToken,uint srcAmount,bytes memory swapCallData)public {
        IERC20(srcToken).transferFrom(msg.sender, address(this), srcAmount);       
        IERC20(srcToken).approve(_1inchRouterAddress, srcAmount);

        (bool success, ) = address(_1inchRouterAddress).call(swapCallData);
        require(success,"Swap Failed !" );
        
    }
    function withdraw(address destToken)public payable {
        IERC20(destToken).transfer(msg.sender, IERC20(destToken).balanceOf(address(this)) );
        require(IERC20(destToken).balanceOf(address(this))==0,"Withdraw Failed !" );

    }

}
