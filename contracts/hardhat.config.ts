import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      // rpc url, change it according to your ganache configuration
      url: 'http://localhost:8545',
      // the private key of signers, change it according to your ganache user
      accounts: [
        '0xa929791af686eb8cdcd696dfde94a9dafc974126a2251e7d5ebcb81f7bc5833e',
        '0x7ebfbcf38bb5026483dc9588e90b64b4a2387899452d41d7d24a6ded098de946'
      ]
    },
  },
};

export default config;
