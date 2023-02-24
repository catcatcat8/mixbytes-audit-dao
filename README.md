# MixBytes Farm Audit Report Litrafi

## Project overview
The project consists of several smart contracts including ERC20 token with mining parameters, ownership contracts, pause control contract and the DAO contract.

Votings for executing or non-executing some EVM script takes place in the DAO contract. Each voting token (MiniMeToken) holder has the right to vote on proposals. The number of votes is determined by the balance of the token holder on the previous block in which the proposal was created. Everyone can execute an accepted proposal.

In addition, the project also contains a contract that changes the ERC20 input token to WETH in the curve pool.

***

## Finding Severity breakdown

All vulnerabilities discovered during the audit are classified based on their potential severity and have the following classification:

Severity | Description
--- | ---
Critical | Bugs leading to assets theft, fund access locking, or any other loss funds to be transferred to any party. 
High     | Bugs that can trigger a contract failure. Further recovery is possible only by manual modification of the contract state or replacement.
Medium   | Bugs that can break the intended contract logic or expose it to DoS attacks, but do not cause direct loss funds.
Low | Other non-essential issues and recommendations reported to/ acknowledged by the team.

***

## Summary of findings

Severity | # of Findings
--- | ---
CRITICAL| 1
HIGH    | 1
MEDIUM  | 1
LOW | 8

During the audit process, 1 CRITICAL, 1 HIGH, 1 MEDIUM and 8 LOW severity findings were spotted and acknowledged.

***

## Findings

### Critical

#### 1. WETH is always transferred to the privileged person (requires additional communication with developers)

##### Description
If the contract `SimpleBurner.sol` assumes that the money should be transferred to the person who called the contract, then at line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/burner/SimpleBurner.sol#L44 all WETH received after swap will always be trasnferred to the `receiver` address specified in constructor.
##### Recommendation
If the intended logic matches what is described in the "description" block, use:
```solidity
pool.exchange(i, j, inAmount, 0, true, payable(msg.sender));
```

***

### High

#### 1. Lack of checks in initialize function

##### Description
If the `voteTime` variable is set to `0` at line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L153, then no one will be able to vote cause of division by zero at line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L467. In this case, the contract will need to be redeployed as there is no ability to change this variable. 
If the `_token` variable is set to zero address the contract will also need to be redeployed.

##### Recommendation
It is recommended to add an additional checks in `initialize()` function:
```solidity
require(_token != address(0));
require(_voteTime != 0);
```

***

### Medium

#### 1. Mint of uncontrollable amount of tokens (requires additional communication with developers) 

##### Description
The function named `availableSupply()` at the line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/LA.sol#L88 seems to show how much of token supply is available for the current time. But the privileged person `minter` can mint uncontrollable `_value` of tokens (at the line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/LA.sol#L159) specified as the parameter of the function.

##### Recommendation
If this behavior is not intended, add the require
```solidity
require(_totalSupply <= availiableSupply);
```
after the line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/LA.sol#L159.

***

### Low

#### 1. Extra code duplication

##### Description
There are non-optimal gas costs as events at lines https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L484-L489 can be emitted in duplicate code from above https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L475-L480.

Code block https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L540-L542 duplicates https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L526-L528.

##### Recommendation
Delete https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L484-L489 code block and put emitting of events at lines https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L475-L480.

Delete https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L484-L489 code block.

***

#### 2. Incorrect argument of event

##### Description
The `totalSupply` argument at line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L448 should be taken from the same time from which the token balances are taken.

##### Recommendation
Change `token.totalSupply()` to `totalSupplyAt(snapshotBlock)`.

***

#### 3. Never used contract/parameter and useless function (requires additional communication with developers)

##### Description
The contract https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/ParameterAdminManaged.sol#L5 is never used in the scope of audit. If there are some other contracts that refer to it, that's fine.
The function https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L322 seems to be useless as it has no parameters and always returns `true`.
The second parameter at line https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L342 is never used. 

##### Recommendation
Check if the contract/function/parameter from description is needed.

***

#### 4. Typos in function names

##### Description
There are typos in
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/LA.sol#L145,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/LA.sol#L40 (and wherever it is called)
function names.

##### Recommendation
Correctly rename functions.

***

#### 5. Missed events

##### Description
There are missed events for
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/burner/SimpleBurner.sol#L26,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/Stoppable.sol#L14,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/OwnershipAdminManaged.sol#L20,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/OwnershipAdminManaged.sol#L16,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/EmergencyAdminManaged.sol#L18,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/EmergencyAdminManaged.sol#L22,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L225,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/Voting.sol#L229
functions.

##### Recommendation
It is recommended to emit events for these functions.

***

#### 6. Not using ready-made openzeppelin solutions

##### Description
The contract `Stoppable.sol` implements ready-made ownership and pausable patterns of openzeppelin contracts.

##### Recommendation
Consider implementing `Stoppable.sol` contract by taking `AccessControl.sol` and `Pausable.sol` contracts from openzeppelin.

***

#### 7. Unused imports

##### Description
Imports at 
* https://github.com/litrafi/litra-contract/blob/main/contracts/tokenize/WrappedNFT.sol#L4,
* https://github.com/litrafi/litra-contract/blob/main/contracts/utils/NftReceiver.sol/#L4,
* https://github.com/litrafi/litra-contract/blob/main/contracts/dao/admin/Stoppable.sol#L4,
are never used.

##### Recommendation
Delete these imports to improve code readability.

***

#### 8. Floating pragma

##### Description
All contracts except the `Voting.sol` have floating pragma ^0.8.0. Locking the pragma helps to ensure that contracts do not accidentally get deployed using, for example, an outdated compiler version that might introduce bugs that affect the contract system negatively.

##### Recommendation
It is recommended that the pragma should be fixed to the version that you are intending to deploy your contracts with.
