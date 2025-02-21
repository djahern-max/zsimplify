export async function matchReceiptToStatement(receipt, statement) {
  // Clean and normalize values for comparison
  const receiptAmount = parseFloat(receipt.Amount?.toString().trim() || '0')
  const statementAmount = parseFloat(statement.Amount?.toString().trim() || '0')
  const receiptRemark = receipt[" Remark "]?.toString().trim() // Note the spaces
  const statementLast4 = statement['Last 4']?.toString().trim()

  console.log('Comparing:', {
    receipt: {
      amount: receiptAmount,
      remark: receiptRemark
    },
    statement: {
      amount: statementAmount,
      last4: statementLast4
    }
  })

  // Direct comparison with exact matches
  if (Math.abs(receiptAmount - statementAmount) < 0.01 &&
    receiptRemark === statementLast4) {
    return "MATCH"
  }

  return `No match: Amount (${receiptAmount} vs ${statementAmount}), Remark (${receiptRemark} vs ${statementLast4})`
}