import { BigNumber } from 'ethers'
import { expect } from 'chai'

import { NFT } from '../typechain'

import { setupUser, setupUsers } from './utils/index'
import { ethers, deployments, getNamedAccounts, getUnnamedAccounts, time, network } from 'hardhat'

async function setup() {
  await deployments.fixture(['NFT'])

  const contracts = {
    nft: (await ethers.getContract('NFT')) as NFT,
  }

  const { owner } = await getNamedAccounts()
  const users = await setupUsers(await getUnnamedAccounts(), contracts)
  return {
    ...contracts,
    users,
    owner: await setupUser(owner, contracts)
  }
}

describe('Nft unit tests', () => {
  const IPFS_URI = 'https://ipfs.io/ipfs/'
  const NFT_URI = 'zxc.json'
  const DEFAULT_MAX_COUNT_PER_BATCH = 10
  it('Constructor', async () => {
    const { nft } = await setup()
    expect(await nft.uri(0)).to.be.equal(IPFS_URI)
    expect(await nft.maxCountPerBatch()).to.be.equal(DEFAULT_MAX_COUNT_PER_BATCH)
  })
  it('Successful creating NFT', async () => {
    const { nft, users } = await setup()
    expect(await nft.balanceOf(users[0].address, 0)).to.be.equal(BigNumber.from(0))
    await users[0].nft.createNft(1, NFT_URI)
    expect(await nft.createdIdsCount()).to.be.equal(BigNumber.from(1))

    expect(await nft.balanceOf(users[0].address, 0)).to.be.equal(BigNumber.from(1))
    expect(await nft.uri(0)).to.be.equal(IPFS_URI + NFT_URI)

    await users[0].nft.createNft(2, NFT_URI)
    expect(await nft.createdIdsCount()).to.be.equal(BigNumber.from(2))

    expect(await nft.balanceOf(users[0].address, 1)).to.be.equal(BigNumber.from(2))
    expect(await nft.uri(1)).to.be.equal(IPFS_URI + NFT_URI)
  })
  it('Successful creating batch NFTs and updating max count per batch', async () => {
    const { nft, users, owner } = await setup()
    await users[0].nft.createBatchNfts(
      10,
      [1, 2, 3, 4, 1, 2, 3, 4, 1, 2],
      [NFT_URI, NFT_URI, 'abc.json', NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI]
    )
    expect(await nft.createdIdsCount()).to.be.equal(BigNumber.from(10))

    expect(await nft.balanceOf(users[0].address, 0)).to.be.equal(BigNumber.from(1))
    expect(await nft.balanceOf(users[0].address, 2)).to.be.equal(BigNumber.from(3))
    expect(await nft.uri(0)).to.be.equal(IPFS_URI + NFT_URI)
    expect(await nft.uri(2)).to.be.equal(IPFS_URI + 'abc.json')

    await expect(owner.nft.updateMaxCountPerBatch(1)).to.be.revertedWith("Invalid count")
    await owner.nft.updateMaxCountPerBatch(11)
    expect(await nft.maxCountPerBatch()).to.be.equal(BigNumber.from(11))
    await users[0].nft.createBatchNfts(
      11,
      [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3],
      [NFT_URI, NFT_URI, 'abc.json', NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI]
    )
  })
  it('Creating batch NFTs failed', async () => {
    const { nft, users } = await setup()
    await expect(
      users[0].nft.createBatchNfts(
        11,
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1],
        [NFT_URI, NFT_URI, 'abc.json', NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI, NFT_URI]
      )
    ).to.be.revertedWith('MAX_COUNT_PER_BATCH exceeded')
    await expect(users[0].nft.createBatchNfts(3, [1, 2, 3], [NFT_URI, NFT_URI])).to.be.revertedWith(
      'Ids and uris length mismatch'
    )
    await expect(users[0].nft.createBatchNfts(3, [1, 2, 3, 4], [NFT_URI, NFT_URI, NFT_URI])).to.be.revertedWith(
      'ERC1155: ids and amounts length mismatch'
    )
  })
})
