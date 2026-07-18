use aiken/collection/list
use cardano/transaction.{Transaction, OutputReference, InlineDatum}

pub type VoteStatus {
  Pending
  Approve
  Reject
}

pub type JurorVotes {
  juror_1: VoteStatus,
  juror_2: VoteStatus,
  juror_3: VoteStatus,
}

pub type Datum {
  evidence_hash: ByteArray,
  juror_1_vkh: ByteArray,
  juror_2_vkh: ByteArray,
  juror_3_vkh: ByteArray,
  votes: JurorVotes,
}

pub type Redeemer {
  juror_index: Int,
  decision: VoteStatus,
}

fn juror_vkh(datum: Datum, index: Int) -> ByteArray {
  if index == 1 {
    datum.juror_1_vkh
  } else if index == 2 {
    datum.juror_2_vkh
  } else {
    datum.juror_3_vkh
  }
}

fn current_vote(votes: JurorVotes, index: Int) -> VoteStatus {
  if index == 1 {
    votes.juror_1
  } else if index == 2 {
    votes.juror_2
  } else {
    votes.juror_3
  }
}

fn update_votes(votes: JurorVotes, index: Int, decision: VoteStatus) -> JurorVotes {
  if index == 1 {
    JurorVotes { ..votes, juror_1: decision }
  } else if index == 2 {
    JurorVotes { ..votes, juror_2: decision }
  } else {
    JurorVotes { ..votes, juror_3: decision }
  }
}

fn count_approvals(votes: JurorVotes) -> Int {
  let v1 = if votes.juror_1 == Approve { 1 } else { 0 }
  let v2 = if votes.juror_2 == Approve { 1 } else { 0 }
  let v3 = if votes.juror_3 == Approve { 1 } else { 0 }
  v1 + v2 + v3
}

validator greenproof_dao {
  spend(datum_opt: Option<Datum>, redeemer: Redeemer, own_ref: OutputReference, self: Transaction) -> Bool {
    expect Some(datum) = datum_opt

    expect redeemer.juror_index == 1 || redeemer.juror_index == 2 || redeemer.juror_index == 3

    expect current_vote(datum.votes, redeemer.juror_index) == Pending

    let signer = juror_vkh(datum, redeemer.juror_index)
    expect list.has(self.extra_signatories, signer)

    let new_votes = update_votes(datum.votes, redeemer.juror_index, redeemer.decision)
    let approvals = count_approvals(new_votes)

    if approvals >= 2 {
      True
    } else {
      expect Some(own_input) = transaction.find_input(self.inputs, own_ref)
      let script_address = own_input.output.address

      expect [continuing_output] =
        list.filter(self.outputs, fn(output) { output.address == script_address })

      expect InlineDatum(cont_datum) = continuing_output.datum
      expect parsed_datum: Datum = cont_datum

      let expected_datum = Datum { ..datum, votes: new_votes }

      parsed_datum == expected_datum && continuing_output.value == own_input.output.value
    }
  }

  else(_) {
    fail
  }
}
